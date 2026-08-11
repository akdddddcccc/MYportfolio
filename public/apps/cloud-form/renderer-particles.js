(() => {
  const $ = s => document.querySelector(s), canvas = $('#viewport'), gl = canvas.getContext('webgl', { alpha:false, antialias:false });
  if (!gl) return alert('此浏览器需要 WebGL。');
  const ui={faces:$('#show-faces'),edges:$('#show-edges'),nodes:$('#show-nodes'),density:$('#density'),pointSize:$('#point-size'),inertia:$('#inertia'),densityOut:$('#density-output'),sizeOut:$('#point-size-output'),inertiaOut:$('#inertia-output')};
  ui.density.min=10000;ui.density.max=100000;ui.density.step=5000;ui.density.value=60000;ui.densityOut.value='60,000';
  const s={yaw:-.58,pitch:.38,zoom:1,drag:false,x:0,y:0,last:0,frame:0,settle:true,model:null,data:null};let program,buffers;const rnd=seeded(501);
  function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function cube(){return normalise({vertices:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]]});}
  function parseOBJ(text){const v=[],f=[];text.split(/\r?\n/).forEach(line=>{const p=line.trim().split(/\s+/);if(p[0]==='v'&&p.length>3)v.push([+p[1],+p[2],+p[3]]);if(p[0]==='f'&&p.length>3){const a=p.slice(1).map(x=>{const n=+x.split('/')[0];return n<0?v.length+n:n-1;}).filter(Number.isFinite);if(a.length>2)f.push(a);}});if(v.length<3||!f.length)throw Error('未找到有效的 OBJ 顶点和面。');return normalise({vertices:v,faces:f});}
  function normalise(m){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];m.vertices.forEach(p=>p.forEach((x,i)=>{lo[i]=Math.min(lo[i],x);hi[i]=Math.max(hi[i],x);}));const c=lo.map((x,i)=>(x+hi[i])/2),span=Math.max(...hi.map((x,i)=>x-lo[i]))||1;m.vertices=m.vertices.map(p=>p.map((x,i)=>(x-c[i])*2/span));return m;}
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,n)=>[a[0]*n,a[1]*n,a[2]*n];
  function area(a,b,c){const u=sub(b,a),v=sub(c,a);return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])*.5;}function sphere(r){const z=rnd()*2-1,a=rnd()*Math.PI*2,q=Math.sqrt(1-z*z)*r;return[Math.cos(a)*q,Math.sin(a)*q,z*r];}
  function build(){const m=s.model,tris=[],edges=new Map();m.faces.forEach(face=>{for(let i=1;i<face.length-1;i++)tris.push([face[0],face[i],face[i+1]]);face.forEach((a,i)=>{const b=face[(i+1)%face.length],k=a<b?`${a}/${b}`:`${b}/${a}`;edges.set(k,[a,b]);});});const ar=tris.map(t=>area(...t.map(i=>m.vertices[i]))),total=ar.reduce((a,b)=>a+b,0),cum=[];ar.reduce((a,b,i)=>(cum[i]=a+b,a+b),0);const faces=+ui.density.value,edgeCount=Math.max(18000,Math.round(faces*.46)),vertexCount=Math.max(5000,Math.round(faces*.13)),count=faces+edgeCount+vertexCount,pos=new Float32Array(count*3),base=new Float32Array(count),size=new Float32Array(count),kind=new Uint8Array(count),yaw=new Float32Array(count),pitch=new Float32Array(count),lag=new Float32Array(count),list=[...edges.values()];let n=0;
    const put=(p,l,z,k,r)=>{pos.set(p,n*3);base[n]=l;size[n]=z;kind[n]=k;yaw[n]=s.yaw;pitch[n]=s.pitch;lag[n++]=r;};
    for(let j=0;j<faces;j++){const target=rnd()*total;let a=0,b=cum.length-1;while(a<b){const mid=(a+b)>>1;if(cum[mid]<target)a=mid+1;else b=mid;}const [ia,ib,ic]=tris[a],A=m.vertices[ia],B=m.vertices[ib],C=m.vertices[ic];let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v;}const p=add(A,add(mul(sub(B,A),u),mul(sub(C,A),v))),edge=Math.min(u,v,1-u-v),glow=Math.exp(-Math.pow(edge/.12,2));put(add(p,sphere(.012+rnd()*.023)),.025+rnd()*.06+glow*(.13+rnd()*.15),.55+glow*.8+rnd()*.42,0,.3+rnd()*.75);}
    // At either end of an edge, the light band grows wider and brighter. It merges into the vertex instead of terminating at it.
    for(let j=0;j<edgeCount;j++){const [ia,ib]=list[Math.floor(rnd()*list.length)],a=m.vertices[ia],b=m.vertices[ib];let t=rnd();if(rnd()<.56)t=rnd()<.5?Math.pow(rnd(),2.15):1-Math.pow(rnd(),2.15);const corner=Math.max(Math.exp(-Math.pow(t/.22,2)),Math.exp(-Math.pow((1-t)/.22,2))),center=add(a,mul(sub(b,a),t)),radius=Math.pow(rnd(),1.7)*(.065+corner*.115);put(add(center,sphere(radius)),.1+corner*.32+Math.pow(1-radius/(.065+corner*.115),1.5)*.18+rnd()*.1,.9+corner*1.9+rnd()*1.25,1,.1+rnd()*.24);}
    // Vertex particles are biased into their connected edge directions, forming a projecting corner rather than a circular blob.
    const neighbours=m.vertices.map(()=>[]);list.forEach(([a,b])=>{neighbours[a].push(b);neighbours[b].push(a);});
    for(let j=0;j<vertexCount;j++){const id=Math.floor(rnd()*m.vertices.length),v=m.vertices[id],to=m.vertices[neighbours[id][Math.floor(rnd()*neighbours[id].length)]],along=Math.pow(rnd(),2.2)*.23,spread=Math.pow(rnd(),2.35)*.105,p=add(add(v,mul(sub(to,v),along)),sphere(spread));put(p,.25+Math.pow(1-along/.23,1.4)*.4+rnd()*.15,1.55+rnd()*2.35,2,.025+rnd()*.09);}
    s.data={count,pos,base,light:base.slice(),size,kind,yaw,pitch,lag};upload();s.settle=true;request();}
  function compile(type,src){const x=gl.createShader(type);gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x;}
  function init(){program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,`attribute vec3 p;attribute float light,size,yaw,pitch;uniform float aspect,zoom,scale;varying float l;void main(){float cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);float x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp,d=p.y*sp+z*cp,k=1.0/(2.9-d*.28);gl_Position=vec4(x*zoom*k/aspect,y*zoom*k,d*.02,1.);gl_PointSize=max(.75,size*scale*k*3.2);l=light*(.72+d*.1);}`));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;varying float l;void main(){float d=length(gl_PointCoord-.5);float soft=1.-smoothstep(.12,.5,d);gl_FragColor=vec4(vec3(1.),l*soft);}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));buffers={};['pos','light','size','yaw','pitch'].forEach(k=>buffers[k]=gl.createBuffer());gl.clearColor(.018,.018,.018,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);}
  function upload(){const d=s.data;[['pos',d.pos,gl.STATIC_DRAW],['light',d.light,gl.DYNAMIC_DRAW],['size',d.size,gl.STATIC_DRAW],['yaw',d.yaw,gl.DYNAMIC_DRAW],['pitch',d.pitch,gl.DYNAMIC_DRAW]].forEach(([k,x,u])=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffers[k]);gl.bufferData(gl.ARRAY_BUFFER,x,u);});}
  function attr(name,buf,parts){const l=gl.getAttribLocation(program,name);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,parts,gl.FLOAT,false,0,0);}function short(a){return Math.atan2(Math.sin(a),Math.cos(a));}
  function visibility(){const d=s.data;if(!d)return;for(let i=0;i<d.count;i++)d.light[i]=(d.kind[i]===0?ui.faces.checked:d.kind[i]===1?ui.edges.checked:ui.nodes.checked)?d.base[i]:0;gl.bindBuffer(gl.ARRAY_BUFFER,buffers.light);gl.bufferSubData(gl.ARRAY_BUFFER,0,d.light);}
  function draw(dt){const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.clear(gl.COLOR_BUFFER_BIT);const d=s.data;if(!d)return;const strength=.12+(+ui.inertia.value/100)*1.55;let moving=false;for(let i=0;i<d.count;i++){if(!d.light[i])continue;const f=1-Math.exp(-dt/(.045+d.lag[i]*strength));d.yaw[i]+=short(s.yaw-d.yaw[i])*f;d.pitch[i]+=(s.pitch-d.pitch[i])*f;moving=moving||Math.abs(short(s.yaw-d.yaw[i]))+Math.abs(s.pitch-d.pitch[i])>.0015;}gl.bindBuffer(gl.ARRAY_BUFFER,buffers.yaw);gl.bufferSubData(gl.ARRAY_BUFFER,0,d.yaw);gl.bindBuffer(gl.ARRAY_BUFFER,buffers.pitch);gl.bufferSubData(gl.ARRAY_BUFFER,0,d.pitch);gl.useProgram(program);attr('p',buffers.pos,3);attr('light',buffers.light,1);attr('size',buffers.size,1);attr('yaw',buffers.yaw,1);attr('pitch',buffers.pitch,1);gl.uniform1f(gl.getUniformLocation(program,'aspect'),w/h);gl.uniform1f(gl.getUniformLocation(program,'zoom'),s.zoom);gl.uniform1f(gl.getUniformLocation(program,'scale'),+ui.pointSize.value);gl.drawArrays(gl.POINTS,0,d.count);s.settle=moving;}
  function request(){if(!s.frame)s.frame=requestAnimationFrame(tick);}function tick(t){s.frame=0;const dt=Math.min(.05,Math.max(.001,(t-(s.last||t))/1000));s.last=t;draw(dt);if(s.drag||s.settle)request();}function reset(){s.yaw=-.58;s.pitch=.38;s.zoom=1;s.settle=true;request();}
  $('#file-input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;$('#model-name').textContent=`IMPORTING / ${f.name.toUpperCase()}`;try{const model=await window.loadMeshFile(f);s.model=normalise(model);build();$('#model-name').textContent=`${model.format} / ${f.name.toUpperCase()}${model.simplified?' / AUTO-SIMPLIFIED':''}`;$('#empty-state').classList.remove('visible');reset();}catch(x){console.error(x);$('#model-name').textContent='IMPORT FAILED / TRY A SIMPLER EXPORT';alert(`无法导入模型：${x.message}`);}});canvas.addEventListener('pointerdown',e=>{s.drag=true;s.x=e.clientX;s.y=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!s.drag)return;s.yaw+=(e.clientX-s.x)*.009;s.pitch=Math.max(-1.45,Math.min(1.45,s.pitch+(e.clientY-s.y)*.009));s.x=e.clientX;s.y=e.clientY;s.settle=true;request();});canvas.addEventListener('pointerup',()=>{s.drag=false;s.settle=true;request();});canvas.addEventListener('wheel',e=>{e.preventDefault();s.zoom=Math.max(.35,Math.min(3,s.zoom*Math.exp(-e.deltaY*.001)));request();},{passive:false});Object.values(ui).forEach(el=>el instanceof HTMLInputElement&&el.addEventListener('input',()=>{ui.densityOut.value=(+ui.density.value).toLocaleString();ui.sizeOut.value=(+ui.pointSize.value).toFixed(1);ui.inertiaOut.value=+ui.inertia.value<25?'轻微':+ui.inertia.value<70?'中等':'强烈';if(el===ui.density)build();else visibility();request();}));$('#reset-view').addEventListener('click',reset);addEventListener('keydown',e=>{if(e.key.toLowerCase()==='p')location.search='?mode=skeleton';});addEventListener('resize',request);init();s.model=cube();build();$('#empty-state').classList.add('visible');
  function sampleModel(name) {
    if (name === 'cube') return cube();
    if (name === 'tetrahedron') return normalise({
      vertices: [[0,1,0],[-1,-1,.78],[1,-1,.78],[0,-1,-1]],
      faces: [[0,1,2],[0,2,3],[0,3,1],[1,3,2]]
    });
    if (name === 'hex-prism') {
      const vertices = [];
      for (let i = 0; i < 6; i += 1) {
        const angle = Math.PI / 6 + i * Math.PI / 3;
        vertices.push([Math.cos(angle), -1, Math.sin(angle)]);
      }
      for (let i = 0; i < 6; i += 1) vertices.push([vertices[i][0], 1, vertices[i][2]]);
      return normalise({
        vertices,
        faces: [[0,5,4,3,2,1],[6,7,8,9,10,11],...Array.from({ length: 6 }, (_, i) => [i,(i+1)%6,(i+1)%6+6,i+6])]
      });
    }
    return normalise({
      vertices: [[0,1,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,-1,0]],
      faces: [[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]]
    });
  }

  const sampleNames = { cube: 'CUBE', tetrahedron: 'TRIANGULAR PYRAMID', 'hex-prism': 'HEX PRISM', octahedron: 'OCTAHEDRON' };
  document.querySelectorAll('.sample-button').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.sample;
      s.sourceModel = null;
      s.model = sampleModel(name);
      build();
      document.querySelectorAll('.sample-button').forEach(item => item.classList.toggle('is-active', item === button));
      $('#model-name').textContent = `DEMO / ${sampleNames[name]}`;
      $('#empty-state').classList.remove('visible');
      reset();
    });
  });

  const sharpenToggle = $('#industrial-sharpen');
  const sharpenLevel = $('#sharpen-level');
  const sharpenOutput = $('#sharpen-level-output');
  const modeNote = $('#mode-note');
  const fileInput = $('#file-input');
  const sourceLoader = window.loadMeshFile;
  let cloudMode = 'normal';

  function setCloudMode(mode) {
    cloudMode = mode;
    const professional = mode === 'professional';
    document.querySelectorAll('.mode-button').forEach(button => button.classList.toggle('is-active', button.dataset.cloudMode === mode));
    fileInput.accept = professional ? '.cloudform.json,.json' : '.obj,.fbx,.3dm,.3ds';
    $('.upload-button span').textContent = professional ? '导入精确拓扑数据' : '导入 3D 模型';
    $('.upload-button small').textContent = professional ? '由 Rhino 导出的 .cloudform.json' : 'OBJ / FBX / Rhino 3DM / 3DS';
    modeNote.textContent = professional
      ? '先在 Rhino 运行 ExportCloudFormTopology.py，再导入生成的 JSON；保留精确的面、真实边与节点。'
      : '直接导入 OBJ / FBX / 3DM / 3DS；3DM 会自动读取 Brep 结构，也可开启工业锐化。';
    document.querySelector('.sharpen-controls').hidden = professional;
  }
  document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => setCloudMode(button.dataset.cloudMode)));
  const cloneModel = model => ({
    vertices: model.vertices.map(point => [...point]),
    faces: model.faces.map(face => [...face]),
    structureEdges: model.structureEdges?.map(edge => [...edge]),
    structurePaths: model.structurePaths?.map(path => [...path]),
    structureVertices: model.structureVertices?.slice(),
    nativeTopology: model.nativeTopology,
    format: model.format,
    simplified: model.simplified
  });
  const areaOf = (a,b,c) => area(a,b,c);

  function getFeatureTopology(vertices, faces, level) {
    const normals = faces.map(face => {
      const a = vertices[face[0]], b = vertices[face[1]], c = vertices[face[2]];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const normal = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
      return normal.map(value => value / length);
    });
    const adjacent = new Map();
    faces.forEach((face, faceIndex) => {
      for (let index = 0; index < 3; index += 1) {
        const start = face[index], end = face[(index + 1) % 3];
        const key = start < end ? `${start}/${end}` : `${end}/${start}`;
        const record = adjacent.get(key) || { edge: [start, end], faces: [] };
        record.faces.push(faceIndex);
        adjacent.set(key, record);
      }
    });
    // Stronger levels retain only more decisive turns. A faceted small fillet
    // is made from many low-angle steps and therefore loses its light bands.
    const threshold = .50 + Number(level) * .06;
    const candidates = [];
    adjacent.forEach(record => {
      let turn = Math.PI;
      if (record.faces.length > 1) {
        const first = normals[record.faces[0]], second = normals[record.faces[1]];
        turn = Math.acos(Math.max(-1, Math.min(1, first[0] * second[0] + first[1] * second[1] + first[2] * second[2])));
      }
      candidates.push({ edge: record.edge, turn, boundary: record.faces.length === 1 });
    });
    let selected = candidates.filter(candidate => candidate.boundary || candidate.turn >= threshold);
    // A fully smooth object still needs a restrained structural suggestion;
    // pick only its strongest turns instead of every triangulation edge.
    if (!selected.length) selected = candidates.sort((a, b) => b.turn - a.turn).slice(0, Math.min(24, candidates.length));
    const structureEdges = selected.map(candidate => candidate.edge);
    const degree = new Map();
    structureEdges.forEach(([start, end]) => {
      degree.set(start, (degree.get(start) || 0) + 1);
      degree.set(end, (degree.get(end) || 0) + 1);
    });
    let structureVertices = [...degree.entries()].filter(([, count]) => count !== 2).map(([index]) => index);
    if (!structureVertices.length) structureVertices = [...degree.keys()].slice(0, 24);
    return { structureEdges, structureVertices };
  }

  // A display-only proxy: vertices are clustered at a model-relative scale,
  // then structural lines are rebuilt from meaningful normal turns. It removes
  // the visual emphasis on tessellated fillets while preserving main volumes.
  function sharpenModel(model, level) {
    const source = cloneModel(model);
    const cell = .012 + Number(level) * .016;
    const clusters = new Map();
    const remap = new Array(source.vertices.length);
    source.vertices.forEach((point, index) => {
      const key = point.map(value => Math.round(value / cell)).join(':');
      let cluster = clusters.get(key);
      if (!cluster) {
        cluster = { sum: [0,0,0], count: 0, index: clusters.size };
        clusters.set(key, cluster);
      }
      cluster.sum[0] += point[0]; cluster.sum[1] += point[1]; cluster.sum[2] += point[2]; cluster.count += 1;
      remap[index] = cluster.index;
    });
    const vertices = [...clusters.values()].map(cluster => cluster.sum.map(value => value / cluster.count));
    const faces = [], seen = new Set();
    source.faces.forEach(face => {
      for (let index = 1; index < face.length - 1; index += 1) {
        const triangle = [remap[face[0]], remap[face[index]], remap[face[index + 1]]];
        if (new Set(triangle).size < 3 || areaOf(...triangle.map(id => vertices[id])) < .00002) continue;
        const key = [...triangle].sort((a,b) => a-b).join('/');
        if (!seen.has(key)) { seen.add(key); faces.push(triangle); }
      }
    });
    if (faces.length < 4) return normalise(source);
    const topology = getFeatureTopology(vertices, faces, level);
    return normalise({ vertices, faces, ...topology, sharpened: true });
  }

  function rebuildSourceProxy() {
    if (!s.sourceModel) return;
    s.model = sharpenToggle.checked ? sharpenModel(s.sourceModel, sharpenLevel.value) : normalise(cloneModel(s.sourceModel));
    build();
    reset();
  }

  function updateSharpenLabel() {
    const value = Number(sharpenLevel.value);
    sharpenOutput.value = value < 3 ? '轻微' : value < 6 ? '中等' : '强烈';
  }

  window.loadMeshFile = async file => {
    if (cloudMode === 'professional' && file.name.split('.').pop().toLowerCase() !== 'json') {
      throw new Error('Professional mode accepts only the .cloudform.json exported from Rhino.');
    }
    const model = await sourceLoader(file);
    s.sourceModel = cloneModel(model);
    return sharpenToggle.checked ? sharpenModel(s.sourceModel, sharpenLevel.value) : model;
  };
  sharpenToggle.addEventListener('input', rebuildSourceProxy);
  sharpenLevel.addEventListener('input', () => { updateSharpenLabel(); if (sharpenToggle.checked) rebuildSourceProxy(); });
  updateSharpenLabel();

  // A native 3DM import contributes only true Brep edges here. Mesh-only files
  // retain their deduplicated triangle boundaries as a fallback.
  build = function buildStructureAwareCloud() {
    const model = s.model;
    const triangles = [], fallbackEdges = new Map();
    model.faces.forEach(face => {
      for (let index = 1; index < face.length - 1; index += 1) triangles.push([face[0], face[index], face[index + 1]]);
      face.forEach((start, index) => {
        const end = face[(index + 1) % face.length];
        const key = start < end ? `${start}/${end}` : `${end}/${start}`;
        fallbackEdges.set(key, [start, end]);
      });
    });
    const areas = triangles.map(triangle => area(...triangle.map(index => model.vertices[index])));
    const totalArea = areas.reduce((sum, value) => sum + value, 0) || 1;
    const cumulative = [];
    areas.reduce((sum, value, index) => (cumulative[index] = sum + value, sum + value), 0);
    const structuralEdges = model.structureEdges?.length ? model.structureEdges : [...fallbackEdges.values()];
    // A curved Brep edge may be sampled by several short segments. Keep those
    // segments as one path, otherwise every subdivision endpoint looks like a
    // false node and curved edges become brighter than straight ones.
    const structuralPaths = model.structurePaths?.length ? model.structurePaths : structuralEdges.map(edge => [...edge]);
    const structuralVertices = model.structureVertices?.length
      ? [...new Set(model.structureVertices)]
      : model.structurePaths?.length ? [] : model.vertices.map((_, index) => index);
    const faceCount = +ui.density.value;
    const edgeCount = Math.max(18000, Math.round(faceCount * .46));
    const vertexCount = structuralVertices.length ? Math.max(5000, Math.round(faceCount * .13)) : 0;
    const count = faceCount + edgeCount + vertexCount;
    const pos = new Float32Array(count * 3), base = new Float32Array(count), size = new Float32Array(count);
    const kind = new Uint8Array(count), yaw = new Float32Array(count), pitch = new Float32Array(count), lag = new Float32Array(count);
    let cursor = 0;
    const put = (point, light, particleSize, particleKind, response) => {
      pos.set(point, cursor * 3); base[cursor] = light; size[cursor] = particleSize; kind[cursor] = particleKind;
      yaw[cursor] = s.yaw; pitch[cursor] = s.pitch; lag[cursor++] = response;
    };
    for (let index = 0; index < faceCount; index += 1) {
      const target = rnd() * totalArea;
      let low = 0, high = cumulative.length - 1;
      while (low < high) { const middle = (low + high) >> 1; if (cumulative[middle] < target) low = middle + 1; else high = middle; }
      const [ia, ib, ic] = triangles[low], A = model.vertices[ia], B = model.vertices[ib], C = model.vertices[ic];
      let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const point = add(A, add(mul(sub(B, A), u), mul(sub(C, A), v)));
      // Triangles only provide an area sampler. Their internal diagonals are
      // never structural edges, so face particles must not brighten near them.
      // Keep a clearly legible, evenly distributed surface field. The contrast
      // belongs to structural edges, never to the temporary triangle seams.
      put(add(point, sphere(.012 + rnd() * .023)), .095 + rnd() * .115, .86 + rnd() * .72, 0, .3 + rnd() * .75);
    }
    const pathMetrics = structuralPaths.map(path => {
      const lengths = path.slice(1).map((end, index) => Math.hypot(...sub(model.vertices[end], model.vertices[path[index]])));
      return { path, lengths, length: lengths.reduce((sum, value) => sum + value, 0) || 1 };
    });
    const pathLength = pathMetrics.reduce((sum, metric) => sum + metric.length, 0) || 1;
    const pickPath = () => {
      let target = rnd() * pathLength;
      for (const metric of pathMetrics) { target -= metric.length; if (target <= 0) return metric; }
      return pathMetrics[pathMetrics.length - 1];
    };
    const pointOnPath = (metric, position) => {
      let distance = position * metric.length;
      for (let index = 0; index < metric.lengths.length; index += 1) {
        if (distance <= metric.lengths[index] || index === metric.lengths.length - 1) {
          return { start: metric.path[index], end: metric.path[index + 1], local: distance / metric.lengths[index] };
        }
        distance -= metric.lengths[index];
      }
      return { start: metric.path[0], end: metric.path[1], local: 0 };
    };
    const neighbours = model.vertices.map(() => []);
    structuralPaths.forEach(path => {
      const start = path[0], end = path[path.length - 1];
      neighbours[start].push(end); neighbours[end].push(start);
    });
    for (let index = 0; index < edgeCount; index += 1) {
      const metric = pickPath();
      let t = rnd(); if (rnd() < .56) t = rnd() < .5 ? Math.pow(rnd(), 2.15) : 1 - Math.pow(rnd(), 2.15);
      const corner = Math.max(Math.exp(-Math.pow(t / .22, 2)), Math.exp(-Math.pow((1 - t) / .22, 2)));
      const segment = pointOnPath(metric, t), A = model.vertices[segment.start], B = model.vertices[segment.end];
      const center = add(A, mul(sub(B, A), segment.local)), radius = Math.pow(rnd(), 1.7) * (.065 + corner * .115);
      put(add(center, sphere(radius)), .1 + corner * .32 + Math.pow(1 - radius / (.065 + corner * .115), 1.5) * .18 + rnd() * .1, .9 + corner * 1.9 + rnd() * 1.25, 1, .1 + rnd() * .24);
    }
    for (let index = 0; index < vertexCount; index += 1) {
      const id = structuralVertices[Math.floor(rnd() * structuralVertices.length)], vertex = model.vertices[id], options = neighbours[id];
      const neighbour = options.length ? model.vertices[options[Math.floor(rnd() * options.length)]] : vertex;
      const along = Math.pow(rnd(), 2.2) * .23, spread = Math.pow(rnd(), 2.35) * .105;
      put(add(add(vertex, mul(sub(neighbour, vertex), along)), sphere(spread)), .25 + Math.pow(1 - along / .23, 1.4) * .4 + rnd() * .15, 1.55 + rnd() * 2.35, 2, .025 + rnd() * .09);
    }
    s.data = { count, pos, base, light: base.slice(), size, kind, yaw, pitch, lag };
    upload(); s.settle = true; request();
  };
  build();

  // The built-in demo is already rendered, so it is not an empty state.
  $('#empty-state').classList.remove('visible');

  // Never leave the demo cube visible while a new model is being decoded.
  $('#file-input').addEventListener('change', event => {
    if (!event.target.files[0]) return;
    s.data = null;
    s.settle = false;
    $('#empty-state').classList.remove('visible');
    request();
  });
})();
