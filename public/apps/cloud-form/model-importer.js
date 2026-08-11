(() => {
  // Keep the import pipeline self-contained so the tool also works after it is
  // copied into a static portfolio deployment with no third-party CDN request.
  const THREE_BASE = "./vendor/three";
  const CLOUD_FORM_ASSET_VERSION = "20260811-2";
  const versioned = path => `${path}?v=${CLOUD_FORM_ASSET_VERSION}`;
  let threePromise;
  const getThree = () => (threePromise ||= import(versioned(`${THREE_BASE}/build/three.module.js`)));
  const loaderUrls = {
    fbx: versioned(`${THREE_BASE}/examples/jsm/loaders/FBXLoader.js`),
    "3ds": versioned(`${THREE_BASE}/examples/jsm/loaders/TDSLoader.js`)
  };
  // Kept beside the tool so 3DM import works offline and never relies on the
  // Rhino installation (or a CDN) on the visitor's computer.
  const RHINO_ASSET_PATH = "./vendor/rhino3dm/";
  let rhinoPromise;

  function within(ms, promise, message) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  function getRhino() {
    if (!rhinoPromise) {
      rhinoPromise = import(versioned(`${RHINO_ASSET_PATH}rhino3dm.module.js`))
        .then(({ default: initRhino }) => initRhino({ locateFile: file => versioned(`${RHINO_ASSET_PATH}${file}`) }));
    }
    return rhinoPromise;
  }

  async function readRhinoStructure(file) {
    const rhino = await within(20000, getRhino(), "Rhino 3DM engine could not start within 20 seconds. Check your network connection and retry.");
    const doc = rhino.File3dm.fromByteArray(new Uint8Array(await file.arrayBuffer()));
    const paths = [], nodes = [], faceMeshes = [];
    const objects = doc.objects();

    for (let objectIndex = 0; objectIndex < objects.count; objectIndex += 1) {
      const object = objects.get(objectIndex);
      const geometry = object.geometry();
      const convertedExtrusion = geometry?.objectType === rhino.ObjectType.Extrusion;
      const brep = convertedExtrusion ? geometry.toBrep(true) : geometry;
      if (geometry?.objectType === rhino.ObjectType.Mesh) {
        // Some Rhino documents contain native Mesh objects alongside Breps.
        // Read them through Rhino's local WASM bridge so importing them never
        // falls back to Three's dynamic 3DMLoader module.
        const buffers = geometry.toThreejsBuffers(false);
        if (buffers?.position?.length && buffers?.index?.length) faceMeshes.push(buffers);
      } else if (brep?.objectType === rhino.ObjectType.Brep) {
        // Keep triangulation only for surface sampling. Structural particles are
        // intentionally read from the Brep below, never from these triangles.
        const brepFaces = brep.faces();
        for (let faceIndex = 0; faceIndex < brepFaces.count; faceIndex += 1) {
          const face = brepFaces.get(faceIndex);
          const mesh = face.getMesh(rhino.MeshType.Any);
          if (mesh) {
            const buffers = mesh.toThreejsBuffers(false);
            if (buffers?.position?.length && buffers?.index?.length) faceMeshes.push(buffers);
            mesh.delete?.();
          }
          face.delete();
        }
        brepFaces.delete?.();

        const edges = brep.edges();
        for (let edgeIndex = 0; edgeIndex < edges.count; edgeIndex += 1) {
          const edge = edges.get(edgeIndex);
          const divisions = edge.isLinear() ? 1 : Math.min(40, Math.max(8, edge.spanCount * 8));
          const domain = edge.domain;
          const path = [];
          for (let step = 0; step <= divisions; step += 1) {
            const t = domain[0] + (domain[1] - domain[0]) * (step / divisions);
            path.push(edge.pointAt(t));
          }
          if (path.length > 1) paths.push(path);
          edge.delete();
        }
        edges.delete?.();

        const vertices = brep.vertices();
        for (let vertexIndex = 0; vertexIndex < vertices.count; vertexIndex += 1) {
          const vertex = vertices.get(vertexIndex);
          nodes.push(vertex.location);
          vertex.delete();
        }
        vertices.delete?.();
      }
      if (convertedExtrusion) brep?.delete?.();
      object.delete();
    }
    doc.delete();
    return paths.length || faceMeshes.length ? { paths, nodes, faceMeshes } : null;
  }

  function rhinoStructureToModel(structure) {
    if (!structure?.faceMeshes?.length) return null;
    const vertices = [], faces = [];
    let sourceTriangles = 0;
    structure.faceMeshes.forEach(mesh => {
      const offset = vertices.length;
      for (let index = 0; index < mesh.position.length; index += 3) {
        vertices.push([mesh.position[index], mesh.position[index + 1], mesh.position[index + 2]]);
      }
      for (let index = 0; index < mesh.index.length; index += 3) {
        faces.push([offset + mesh.index[index], offset + mesh.index[index + 1], offset + mesh.index[index + 2]]);
        sourceTriangles += 1;
      }
    });
    return vertices.length >= 3 && faces.length
      ? { vertices, faces, format: "3DM", sourceTriangles, simplified: false }
      : null;
  }

  function attachRhinoStructure(model, structure) {
    if (!structure) return model;
    const vectorBetween = (end, start) => [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ];
    const allPoints = model.vertices;
    const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
    allPoints.forEach(point => point.forEach((value, axis) => { low[axis] = Math.min(low[axis], value); high[axis] = Math.max(high[axis], value); }));
    const span = Math.max(...high.map((value, axis) => value - low[axis])) || 1;
    const tolerance = span * 1e-5;
    const lookup = new Map();
    const pointIndex = point => {
      const key = point.map(value => Math.round(value / tolerance)).join(":");
      if (lookup.has(key)) return lookup.get(key);
      const index = allPoints.length;
      allPoints.push([point[0], point[1], point[2]]);
      lookup.set(key, index);
      return index;
    };
    allPoints.forEach((point, index) => {
      const key = point.map(value => Math.round(value / tolerance)).join(":");
      if (!lookup.has(key)) lookup.set(key, index);
    });

    const structurePaths = structure.paths.map(path => path.map(pointIndex).filter((index, position, list) => position === 0 || index !== list[position - 1])).filter(path => path.length > 1);
    const structureEdges = structurePaths.flatMap(path => path.slice(1).map((end, index) => [path[index], end]));
    // A Rhino Brep may split one visually smooth curve into several edges.
    // Only mark an endpoint when its incident paths do not continue tangentially.
    const endpointDirections = new Map();
    const addDirection = (index, direction) => {
      const length = Math.hypot(direction[0], direction[1], direction[2]);
      if (!length) return;
      const list = endpointDirections.get(index) || [];
      list.push(direction.map(value => value / length));
      endpointDirections.set(index, list);
    };
    structurePaths.forEach(path => {
      if (path[0] === path[path.length - 1]) return; // closed curves have no endpoints
      addDirection(path[0], vectorBetween(allPoints[path[1]], allPoints[path[0]]));
      addDirection(path[path.length - 1], vectorBetween(allPoints[path[path.length - 2]], allPoints[path[path.length - 1]]));
    });
    const structureVertices = [];
    endpointDirections.forEach((directions, index) => {
      if (directions.length !== 2) { structureVertices.push(index); return; }
      const dot = directions[0][0] * directions[1][0] + directions[0][1] * directions[1][1] + directions[0][2] * directions[1][2];
      if (dot > -0.94) structureVertices.push(index); // more than ~20 degrees from tangential continuity
    });
    model.structureEdges = structureEdges;
    model.structurePaths = structurePaths;
    model.structureVertices = structureVertices;
    model.nativeTopology = true;
    return model;
  }

  function parseCloudFormData(text) {
    if (!text || !text.trim()) {
      throw new Error("Cloud Form JSON is empty. Re-export it from Rhino, then import the newly created .cloudform.json file.");
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("Cloud Form JSON is incomplete or invalid. Select the .cloudform.json created by the Rhino exporter, not the original 3DM file.");
    }
    if (data.format !== "CloudFormTopology/1") throw new Error("This JSON is not Cloud Form professional topology data.");
    if (!Array.isArray(data.vertices) || !Array.isArray(data.faces) || data.vertices.length < 3 || !data.faces.length) {
      throw new Error("Cloud Form topology data is missing usable faces or vertices.");
    }
    const isIndex = value => Number.isInteger(value) && value >= 0 && value < data.vertices.length;
    if (!data.vertices.every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite)) ||
        !data.faces.every(face => Array.isArray(face) && face.length >= 3 && face.every(isIndex)) ||
        (data.structureEdges && !data.structureEdges.every(edge => Array.isArray(edge) && edge.length === 2 && edge.every(isIndex))) ||
        (data.structurePaths && !data.structurePaths.every(path => Array.isArray(path) && path.length > 1 && path.every(isIndex))) ||
        (data.structureVertices && !data.structureVertices.every(isIndex))) {
      throw new Error("Cloud Form topology data contains invalid geometry indices.");
    }
    return {
      vertices: data.vertices.map(point => [...point]),
      faces: data.faces.map(face => [...face]),
      structureEdges: data.structureEdges?.map(edge => [...edge]) || [],
      structurePaths: data.structurePaths?.map(path => [...path]) || [],
      structureVertices: data.structureVertices?.slice() || [],
      nativeTopology: true,
      format: "CLOUD FORM PRO",
      sourceTriangles: data.faces.length,
      simplified: false
    };
  }

  function parseObjModel(text) {
    const vertices = [], faces = [];
    text.split(/\r?\n/).forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "v" && parts.length >= 4) vertices.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
      if (parts[0] === "f" && parts.length >= 4) {
        const face = parts.slice(1).map(token => {
          const index = Number(token.split("/")[0]);
          return index < 0 ? vertices.length + index : index - 1;
        }).filter(index => Number.isInteger(index) && index >= 0 && index < vertices.length);
        if (face.length >= 3) faces.push(face);
      }
    });
    if (vertices.length < 3 || !faces.length) throw new Error("No usable OBJ vertices or faces were found.");
    return { vertices, faces, format: "OBJ", sourceTriangles: faces.reduce((total, face) => total + face.length - 2, 0), simplified: false };
  }

  window.loadMeshFile = async file => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") return parseCloudFormData(await file.text());
    if (ext === "obj") return parseObjModel(await file.text());
    if (ext !== "3dm" && !loaderUrls[ext]) throw new Error("Only OBJ, FBX, Rhino 3DM, and 3DS files are supported.");
    // For a real Rhino Brep, use Rhino's own face meshes plus exact Brep
    // topology. This skips Three's generic 3DM loader, which discards the
    // Brep graph and can stall on some CAD exports.
    if (ext === "3dm") {
      try {
        const nativeRhinoStructure = await readRhinoStructure(file);
        const nativeModel = rhinoStructureToModel(nativeRhinoStructure);
        if (nativeModel) return attachRhinoStructure(nativeModel, nativeRhinoStructure);
      } catch (error) {
        throw new Error(`Rhino 3DM local parsing failed: ${error?.message || "unknown error"}`);
      }
      throw new Error("This 3DM does not contain a readable Brep, Extrusion, or Mesh object.");
    }
    // Load only the loader the selected file needs. Rhino 3DM is handled above
    // by its bundled local WASM parser and never requests Three's 3DMLoader.
    const [THREE, loaderModule] = await Promise.all([getThree(), import(loaderUrls[ext])]);
    let root;
    if (ext === "fbx") root = new loaderModule.FBXLoader().parse(await file.arrayBuffer(), "");
    else if (ext === "3ds") root = new loaderModule.TDSLoader().parse(await file.arrayBuffer(), "");

    root.updateMatrixWorld(true);
    const meshes = [];
    let sourceTriangles = 0;
    root.traverse(node => {
      if (!node.isMesh || !node.geometry?.attributes?.position) return;
      const position = node.geometry.attributes.position;
      const index = node.geometry.index;
      const triangleCount = Math.floor((index ? index.count : position.count) / 3);
      if (!triangleCount) return;
      meshes.push({ node, position, index, triangleCount });
      sourceTriangles += triangleCount;
    });
    if (!meshes.length) throw new Error("No renderable mesh was found in this file.");

    // Point rendering needs a readable silhouette and joints, not every source
    // triangle. This cap prevents dense CAD exports from exhausting memory.
    const maxTriangles = 120000;
    const stride = Math.max(1, Math.ceil(sourceTriangles / maxTriangles));
    const vertices = [], faces = [];
    let triangleOffset = 0;
    for (const mesh of meshes) {
      const vertexMap = new Map();
      const point = new THREE.Vector3();
      const getVertex = sourceIndex => {
        let mapped = vertexMap.get(sourceIndex);
        if (mapped !== undefined) return mapped;
        point.fromBufferAttribute(mesh.position, sourceIndex).applyMatrix4(mesh.node.matrixWorld);
        mapped = vertices.length;
        vertices.push([point.x, point.y, point.z]);
        vertexMap.set(sourceIndex, mapped);
        return mapped;
      };
      const get = index => mesh.index ? mesh.index.getX(index) : index;
      for (let triangle = 0; triangle < mesh.triangleCount; triangle += 1) {
        const globalTriangle = triangleOffset + triangle;
        // Keep one triangle per mesh so small components do not vanish.
        if (triangle !== 0 && globalTriangle % stride !== 0) continue;
        const offset = triangle * 3;
        faces.push([getVertex(get(offset)), getVertex(get(offset + 1)), getVertex(get(offset + 2))]);
      }
      triangleOffset += mesh.triangleCount;
      await new Promise(requestAnimationFrame);
    }
    if (vertices.length < 3 || !faces.length) throw new Error("No usable triangle data was found in this file.");
    const model = { vertices, faces, format: ext.toUpperCase(), sourceTriangles, simplified: stride > 1 };
    return nativeRhinoStructure ? attachRhinoStructure(model, nativeRhinoStructure) : model;
  };
})();
