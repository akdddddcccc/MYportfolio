import sys, math, random, struct
from bisect import bisect_left
import rhino3dm

source, output = sys.argv[1:3]
up_axis = sys.argv[3].lower() if len(sys.argv) > 3 else "auto"
profile = sys.argv[4].lower() if len(sys.argv) > 4 else "curvature"
vertices, triangles = [], []
face_boundaries = {}

def add_mesh(mesh, planar=None, owner=None):
    if not mesh: return
    offset = len(vertices); vertices.extend((v.X, v.Y, v.Z) for v in mesh.Vertices)
    local_edges={}
    for face in mesh.Faces:
        ids = list(face); triangles.append((offset+ids[0], offset+ids[1], offset+ids[2], planar, owner))
        if len(ids) == 4 and ids[2] != ids[3]: triangles.append((offset+ids[0], offset+ids[2], offset+ids[3], planar, owner))
        for u,v in zip(ids, ids[1:]+ids[:1]):
            key=tuple(sorted((u,v))); local_edges[key]=local_edges.get(key,0)+1
    if owner is not None:
        face_boundaries[owner]=[(vertices[offset+u],vertices[offset+v]) for (u,v),count in local_edges.items() if count == 1]

if source.lower().endswith(".obj"):
    with open(source, "r", encoding="utf-8", errors="replace") as file:
        for line in file:
            parts=line.strip().split()
            if not parts: continue
            if parts[0] == "v" and len(parts) >= 4: vertices.append((float(parts[1]),float(parts[2]),float(parts[3])))
            elif parts[0] == "f" and len(parts) >= 4:
                ids=[]
                for value in parts[1:]:
                    index=int(value.split("/")[0]); ids.append(index-1 if index > 0 else len(vertices)+index)
                for i in range(1,len(ids)-1): triangles.append((ids[0],ids[i],ids[i+1],None,None))
else:
    model = rhino3dm.File3dm.Read(source)
    face_id=0
    visible_layers={index: layer.Visible for index,layer in enumerate(model.Layers)}
    for item in model.Objects:
        # Rhino files often retain alternates, construction solids, and earlier
        # iterations on hidden layers.  The point cloud must match the visible
        # Rhino scene rather than silently rendering every stored object.
        if not item.Attributes.Visible or not visible_layers.get(item.Attributes.LayerIndex, True):
            continue
        g = item.Geometry
        if isinstance(g, rhino3dm.Brep):
            for face in g.Faces:
                add_mesh(face.GetMesh(rhino3dm.MeshType.Render), face.IsPlanar(), face_id)
                face_id += 1
        elif isinstance(g, rhino3dm.Extrusion): add_mesh(g.GetMesh(rhino3dm.MeshType.Render))
        elif isinstance(g, rhino3dm.Mesh): add_mesh(g)
if not triangles: raise RuntimeError("No render meshes found in this 3DM")

# Rhino scenes often use Z-up, while the web renderer is Y-up. Place the longest
# object axis upright before normalisation so an imported standing product does not lie down.
raw_lo=[min(v[i] for v in vertices) for i in range(3)]; raw_hi=[max(v[i] for v in vertices) for i in range(3)]
longest_axis=max(range(3), key=lambda i: raw_hi[i]-raw_lo[i])
if up_axis == "z" or (up_axis == "auto" and longest_axis == 2):
    vertices=[(v[0],v[2],-v[1]) for v in vertices]
elif up_axis == "x" or (up_axis == "auto" and longest_axis == 0):
    vertices=[(v[1],v[0],v[2]) for v in vertices]
lo=[min(v[i] for v in vertices) for i in range(3)]; hi=[max(v[i] for v in vertices) for i in range(3)]; span=max(hi[i]-lo[i] for i in range(3))
surface=[]; edge_map={}
def qkey(i): return tuple(round(x*1000) for x in vertices[i])
for ia,ib,ic,planar,owner in triangles:
    a,b,c=vertices[ia],vertices[ib],vertices[ic]; ab=[b[i]-a[i] for i in range(3)]; ac=[c[i]-a[i] for i in range(3)]
    cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]]; length=math.sqrt(sum(x*x for x in cross)); area=length*.5
    if area < 1e-8: continue
    normal=[x/length for x in cross]
    triangle_edges=[]
    for u,v in ((ia,ib),(ib,ic),(ic,ia)):
        key=tuple(sorted((qkey(u),qkey(v))))
        entry=edge_map.setdefault(key,{"a":vertices[u],"b":vertices[v],"normals":[]})
        entry["normals"].append(normal)
        triangle_edges.append(key)
    surface.append({"a":a,"b":b,"c":c,"normal":normal,"area":area,"edges":triangle_edges,"planar":planar,"owner":owner})

def point_segment_distance(point, a, b):
    ab=[b[i]-a[i] for i in range(3)]; ap=[point[i]-a[i] for i in range(3)]
    denom=sum(value*value for value in ab)
    t=0.0 if denom == 0 else max(0.0,min(1.0,sum(ap[i]*ab[i] for i in range(3))/denom))
    return math.sqrt(sum((point[i]-(a[i]+ab[i]*t))**2 for i in range(3)))

def boundary_distance(point, owner):
    boundary=face_boundaries.get(owner)
    return None if not boundary else min(point_segment_distance(point,a,b) for a,b in boundary)

# For each original Rhino face, find the deepest interior point.  A rounded
# rectangular face can then get a soft centre band plus a separate edge halo.
face_depth={}
if profile == "curvature":
    for triangle in surface:
        if triangle["planar"] or triangle["owner"] is None: continue
        centroid=[(triangle["a"][i]+triangle["b"][i]+triangle["c"][i])/3 for i in range(3)]
        distance=boundary_distance(centroid, triangle["owner"])
        if distance is not None: face_depth[triangle["owner"]]=max(face_depth.get(triangle["owner"],0.0),distance)

# The change in face normals across an edge is a lightweight curvature proxy.
# It is zero on a broad planar surface, progressively grows on a rounded form,
# and becomes strongest at a hard crease.  Keeping this value on the triangles
# lets the face, edge, and node layers merge as one continuous density gradient.
for entry in edge_map.values():
    ns=entry["normals"]
    if len(ns) == 1:
        entry["curve"] = .16
    else:
        # Imported render meshes do not always keep a consistent winding order.
        # Curvature is a magnitude: opposite-facing copies of the same plane
        # must read as flat, not as a 180 degree crease.
        min_dot=min(abs(sum(ns[0][k]*n[k] for k in range(3))) for n in ns[1:])
        # A broad industrial fillet is tessellated into many tiny normal steps.
        # Expand those gentle steps here so a large-radius corner reads as a
        # distinct, soft band before the hard-edge layer begins.
        entry["curve"] = min(1.0, math.sqrt(max(0.0, 1.0-min_dot))*2.6)

cumulative=[]; curvature_cumulative=[]; total=0.0; curvature_total=0.0
for triangle in surface:
    triangle_curves=[edge_map[key]["curve"] for key in triangle["edges"]]
    # When source data is Rhino we can ask the original Brep face directly.
    # That is more reliable than trying to infer a mathematical plane from its
    # render triangles, which may contain small tessellation artefacts.
    triangle["curve"] = 0.0 if triangle["planar"] else max(triangle_curves)*.84 + sum(triangle_curves)/3*.16
    # Every face has a thin background population, but the majority of face
    # samples are reserved for curved areas.  This makes the density contrast
    # legible at a glance instead of depending on a subtle random weighting.
    total += triangle["area"]
    cumulative.append(total)
    curvature_total += triangle["area"] * max(.00001, triangle["curve"]**2)
    curvature_cumulative.append(curvature_total)

curve_values=sorted(triangle["curve"] for triangle in surface)
def percentile(value): return curve_values[min(len(curve_values)-1, int((len(curve_values)-1)*value))]
print("curvature p50/p80/p95/max: " + "/".join(f"{percentile(p):.3f}" for p in (.50,.80,.95,1.0)))

features=[]
node_degree={}; node_position={}
for entry in edge_map.values():
    ns=entry["normals"]; sharp=len(ns)==1 or min(abs(sum(ns[0][k]*n[k] for k in range(3))) for n in ns[1:]) < .90
    if sharp:
        a,b=entry["a"],entry["b"]; weight=math.sqrt(sum((a[k]-b[k])**2 for k in range(3))); features.append((a,b,weight))
        for point in (a,b):
            key=tuple(round(x*1000) for x in point); node_degree[key]=node_degree.get(key,0)+1; node_position[key]=point
edge_total=sum(e[2] for e in features); edge_cumulative=[]; run=0
for e in features: run+=e[2]; edge_cumulative.append(run)
feature_vertices=[point for key,point in node_position.items() if node_degree[key] >= 3]

random.seed(20260804); positions=[]; normals=[]; brightness=[]; sizes=[]; lag=[]
def put(p,n,bright,size):
    positions.extend(((p[i]-(lo[i]+hi[i])*.5)/span*2.3 for i in range(3))); normals.extend(n); brightness.append(bright); sizes.append(size); lag.append(random.random())

def halton(index, base):
    value=0.0; fraction=1.0/base
    while index:
        value += fraction*(index % base); index //=base; fraction /= base
    return value

def face_light_profile(triangle, point):
    if profile != "curvature": return 0.0,0.0
    distance=boundary_distance(point,triangle["owner"])
    depth=face_depth.get(triangle["owner"],0.0)
    if distance is None or depth <= 1e-8: return 0.0,0.0
    ratio=max(0.0,min(1.0,distance/depth))
    # The inner part of a fillet is a broad, photographic glow; its two joins
    # receive a smaller halo so the transition into neighbouring faces remains.
    return math.sin(ratio*math.pi*.5)**1.35, math.exp(-((ratio/.19)**2))

if profile == "classic":
    # Original portfolio rendering: an even, photographic surface field with
    # separate edge and node layers, deliberately without curvature emphasis.
    for index in range(1, 44001):
        triangle=surface[bisect_left(cumulative,((index*.61803398875) % 1.0)*total)]
        root=math.sqrt(halton(index,2)); u=1-root; v=halton(index,3)*root; w=1-u-v
        a,b,c,n=triangle["a"],triangle["b"],triangle["c"],triangle["normal"]
        accent=halton(index,5)**7
        put([a[i]*u+b[i]*v+c[i]*w for i in range(3)],n,.18+accent*.36+max(0,n[1])*.1,.65+accent*.8+halton(index,7)*.3)
else:
    for index in range(1, 16001):
        triangle=surface[bisect_left(cumulative,((index*.61803398875) % 1.0)*total)]
        root=math.sqrt(halton(index,2)); u=1-root; v=halton(index,3)*root; w=1-u-v
        a,b,c,n=triangle["a"],triangle["b"],triangle["c"],triangle["normal"]
        accent=halton(index,5)**7
        put([a[i]*u+b[i]*v+c[i]*w for i in range(3)],n,.055+accent*.10+max(0,n[1])*.03,.46+accent*.28)
    for index in range(16001, 44001):
        triangle=surface[bisect_left(curvature_cumulative,((index*.61803398875) % 1.0)*curvature_total)]
        root=math.sqrt(halton(index,2)); u=1-root; v=halton(index,3)*root; w=1-u-v
        a,b,c,n,curve=triangle["a"],triangle["b"],triangle["c"],triangle["normal"],triangle["curve"]
        accent=halton(index,5)**7
        point=[a[i]*u+b[i]*v+c[i]*w for i in range(3)]
        middle,junction=face_light_profile(triangle,point)
        put(point,n,.105+curve*.16+middle*.22+junction*.11+accent*.11+max(0,n[1])*.035,.66+curve*.48+middle*.38+junction*.16+accent*.28)
for _ in range(13500):
    a,b,_=features[bisect_left(edge_cumulative,random.random()*edge_total)]; t=random.random(); near=max(math.exp(-(t/.22)**2),math.exp(-((1-t)/.22)**2)); p=[a[i]*(1-t)+b[i]*t for i in range(3)]
    put(p,[0,1,0],.52+near*.36+random.random()*.12,1.25+near*1.6+random.random()*.8)
for _ in range(2500):
    p=random.choice(feature_vertices); put(p,[0,1,0],.82+random.random()*.18,2.6+random.random()*2.1)
count=len(brightness)
with open(output,"wb") as f:
    f.write(b"SCF1"); f.write(struct.pack("<I",count))
    for values in (positions,normals,brightness,sizes,lag): f.write(struct.pack("<%sf"%len(values),*values))
print(f"{len(vertices)} vertices, {len(surface)} triangles, {len(features)} sharp edges -> {output}")
