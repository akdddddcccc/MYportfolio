import { markRaw } from "/vendor/vue.esm-browser.prod.js";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const FALLBACK = [
  { id: "aluminum", name: "阳极氧化铝合金", region: "主体外壳", finish: "细喷砂 · 低光泽", baseColor: "#aeb2b2", metallic: .88, roughness: .3, transmission: 0, ior: 1.45, emissionColor: "#000000", emissionStrength: 0, confidence: .5 },
  { id: "polymer", name: "磨砂工程塑料", region: "按键 / 顶盖", finish: "微纹理 · 漫反射", baseColor: "#e4e1d9", metallic: .02, roughness: .64, transmission: 0, ior: 1.46, emissionColor: "#000000", emissionStrength: 0, confidence: .5 },
  { id: "glass", name: "半透明导光件", region: "灯带 / 指示灯", finish: "柔和透光 · 自发光", baseColor: "#ff9a45", metallic: 0, roughness: .2, transmission: .45, ior: 1.5, emissionColor: "#ff8a24", emissionStrength: 2.2, confidence: .5 }
];

const PbrBall = {
  props: { material: { type: Object, required: true } },
  data: () => ({ renderer: null, scene: null, camera: null, mesh: null, environment: null, frame: 0, observer: null }),
  mounted() { this.draw = this.draw.bind(this); this.setup(); },
  beforeUnmount() { cancelAnimationFrame(this.frame); this.observer?.disconnect(); this.mesh?.geometry.dispose(); this.mesh?.material.dispose(); this.environment?.dispose(); this.renderer?.dispose(); },
  watch: { material: { deep: true, handler() { this.updateMaterial(); } } },
  methods: {
    setup() {
      const host = this.$refs.host;
      this.scene = markRaw(new THREE.Scene()); this.scene.background = new THREE.Color("#e7e6e1");
      this.camera = markRaw(new THREE.PerspectiveCamera(33, 1, .1, 100)); this.camera.position.set(0, 0, 4);
      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true })); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; host.append(this.renderer.domElement);
      const pmrem = new THREE.PMREMGenerator(this.renderer); this.environment = markRaw(pmrem.fromScene(new RoomEnvironment(this.renderer), .04).texture); pmrem.dispose(); this.scene.environment = this.environment;
      this.mesh = markRaw(new THREE.Mesh(new THREE.SphereGeometry(1.16, 80, 56), new THREE.MeshPhysicalMaterial())); this.scene.add(this.mesh);
      const key = new THREE.DirectionalLight("#fff", 1.2); key.position.set(-3, 3, 4); this.scene.add(key); this.scene.add(new THREE.HemisphereLight("#fff", "#6e7479", .55));
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.updateMaterial(); this.resize(); this.draw();
    },
    updateMaterial() { if (!this.mesh) return; const v = this.material, m = this.mesh.material; m.color.set(v.baseColor); m.metalness = +v.metallic || 0; m.roughness = +v.roughness || 0; m.transmission = +v.transmission || 0; m.ior = +v.ior || 1.5; m.envMapIntensity = m.metalness > .5 ? 1.35 : 1; m.emissive.set(v.emissionColor || "#000"); m.emissiveIntensity = +v.emissionStrength || 0; m.thickness = m.transmission ? .8 : 0; m.transparent = m.transmission > 0; m.needsUpdate = true; },
    resize() { const h = this.$refs.host, w = Math.max(1, h.clientWidth), height = Math.max(1, h.clientHeight); this.renderer.setSize(w, height, false); this.camera.aspect = w / height; this.camera.updateProjectionMatrix(); },
    draw() { this.mesh.rotation.y += .003; this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(this.draw); }
  },
  template: `<div class="shader-pbr-ball" ref="host"></div>`
};

export default {
  name: "ShaderCopilotDemo", components: { PbrBall }, props: { lang: { type: String, required: true } },
  data: () => ({ sourceUrl: "/images/work/ai-shader-copilot-cover.svg", sourceName: "AI Shader Copilot reference", materials: FALLBACK, selectedId: "aluminum", analyzing: false, analyzed: false, configured: false, error: "" }),
  computed: { selected() { return this.materials.find((item) => item.id === this.selectedId) || this.materials[0]; }, zh() { return this.lang === "zh"; } },
  mounted() { addEventListener("paste", this.paste); this.status(); }, beforeUnmount() { removeEventListener("paste", this.paste); },
  methods: {
    base() { return ["127.0.0.1", "localhost"].includes(location.hostname) ? "http://127.0.0.1:8787" : ""; },
    async status() { try { const r = await fetch(`${this.base()}/api/shader-copilot/status`); const data = await r.json(); this.configured = Boolean(data.qwen?.configured); } catch {} },
    setFile(file) { if (!file?.type?.startsWith("image/")) return; this.sourceName = file.name || "Pasted reference"; const reader = new FileReader(); reader.onload = () => { this.sourceUrl = reader.result; this.analyzed = false; }; reader.readAsDataURL(file); },
    paste(event) { const item = [...(event.clipboardData?.items || [])].find((x) => x.type.startsWith("image/")); if (item) { event.preventDefault(); this.setFile(item.getAsFile()); } },
    optimise() { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight)); const c = document.createElement("canvas"); c.width = Math.round(image.naturalWidth * scale); c.height = Math.round(image.naturalHeight * scale); c.getContext("2d").drawImage(image, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", .84)); }; image.onerror = reject; image.src = this.sourceUrl; }); },
    async analyze() { this.analyzing = true; this.error = ""; try { const imageDataUrl = await this.optimise(); const r = await fetch(`${this.base()}/api/shader-copilot/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl, lang: this.lang }) }); const data = await r.json(); if (!r.ok || !data.materials?.length) throw new Error(data.message || "Vision service unavailable"); this.materials = data.materials; this.selectedId = data.materials[0].id; this.analyzed = true; } catch (error) { this.materials = FALLBACK; this.selectedId = "aluminum"; this.analyzed = true; this.error = error.message; } finally { this.analyzing = false; } },
    recipe(m) { return m.emissionStrength > 0 ? "Principled BSDF + Emission + Light guide" : m.transmission > .1 ? "Principled BSDF + Transmission" : m.metallic > .5 ? "Principled BSDF + Noise + Bump" : "Principled BSDF + Noise + Bump"; },
    percent(n) { return `${Math.round((+n || 0) * 100)}%`; }
  },
  template: `<section class="shader-copilot"><header><p>browser material lab</p><div><h2>{{ zh ? '从参考图到可编辑材质' : 'Reference image to editable materials' }}</h2><span>{{ zh ? '上传或粘贴一张参考图，千问视觉会拆解材质假设；右侧以真实 WebGL PBR 材质球预览。' : 'Upload or paste a reference. Qwen vision returns material hypotheses and the browser previews them in real WebGL PBR.' }}</span></div></header><div class="shader-copilot__grid"><aside><small>01 / reference image</small><label class="shader-upload"><input type="file" accept="image/*" @change="setFile($event.target.files[0])"><img :src="sourceUrl" :alt="sourceName"><b>{{ zh ? '上传参考图' : 'Upload reference' }}</b></label><p>Ctrl+V {{ zh ? '也可直接粘贴图片' : 'also pastes an image' }}</p><button class="shader-action" :disabled="analyzing" @click="analyze">{{ analyzing ? (zh ? '正在识别…' : 'Analyzing…') : (zh ? '开始材质识别' : 'Analyze materials') }}</button><small class="shader-online" :class="{ready:configured}">Qwen Vision · {{ configured ? 'ready' : 'demo fallback' }}</small></aside><main><div class="shader-copilot__head"><small>02 / material hypotheses</small><span>{{ analyzed ? materials.length : (zh ? '本地模板' : 'local templates') }}</span></div><p v-if="error" class="shader-error">{{ error }}</p><div class="shader-cards"><button v-for="m in materials" :key="m.id" :class="{selected:m.id===selectedId}" @click="selectedId=m.id"><i :style="{background:m.baseColor}"></i><b>{{ m.name }}</b><small>{{ m.finish }}</small></button></div><div class="shader-inspector"><div><PbrBall :material="selected"/><b>{{ selected.name }}</b><small>{{ selected.finish }}</small></div><article><small>03 / shader recipe</small><div class="shader-nodes"><span>COLOR</span><i></i><span>NOISE</span><i></i><span>{{ selected.emissionStrength > 0 ? 'EMISSION' : 'BUMP' }}</span><i></i><b>BSDF</b></div><p>{{ recipe(selected) }}</p><dl><div><dt>Base color</dt><dd>{{ selected.baseColor }}</dd></div><div><dt>Metallic</dt><dd>{{ percent(selected.metallic) }}</dd></div><div><dt>Roughness</dt><dd>{{ percent(selected.roughness) }}</dd></div><div><dt>Transmission</dt><dd>{{ percent(selected.transmission) }}</dd></div><div><dt>IOR</dt><dd>{{ selected.ior }}</dd></div><div v-if="selected.emissionStrength"><dt>Emission</dt><dd>{{ selected.emissionColor }} · {{ selected.emissionStrength }}</dd></div></dl><p class="shader-region"><b>{{ zh ? '图片区域：' : 'Region: ' }}</b>{{ selected.region }}</p><a href="/downloads/ai-shader-copilot-blender-addon.zip" download>{{ zh ? '下载 Blender 插件' : 'Download Blender add-on' }}</a></article></div></main></div><p class="shader-note">{{ zh ? '提示：单张图只能输出可编辑的材质假设，不是唯一的物理真值；灯光、HDRI 和后期都会影响估计。' : 'A single image yields editable material hypotheses, not unique physical ground truth; lighting, HDRI and post-processing affect the estimate.' }}</p></section>`
};
