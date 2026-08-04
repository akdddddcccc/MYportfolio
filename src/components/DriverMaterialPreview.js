import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const MODEL_URL = "/models/drivers-handle-material.glb";

export default {
  name: "DriverMaterialPreview",
  props: { lang: { type: String, required: true } },
  data() { return { desktop: false, loading: true, failed: false }; },
  mounted() {
    this.media = window.matchMedia("(min-width: 900px) and (pointer: fine)");
    this.desktop = this.media.matches;
    this.media.addEventListener("change", this.onMediaChange);
    if (this.desktop) this.$nextTick(() => this.start());
  },
  beforeUnmount() { this.media?.removeEventListener("change", this.onMediaChange); this.stop(); },
  methods: {
    onMediaChange(event) { this.desktop = event.matches; if (event.matches) this.$nextTick(() => this.start()); else this.stop(); },
    async start() {
      if (this.renderer || !this.$refs.canvas) return;
      try {
        this.createScene();
        const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL_URL);
        this.mountModel(gltf.scene);
        this.loading = false;
        this.resize();
        this.render();
      } catch (error) {
        console.error(error);
        this.failed = true;
        this.loading = false;
      }
    },
    createScene() {
      const canvas = this.$refs.canvas;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xbcc0bd);
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
      this.camera.position.set(0, 0, 880);
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.82;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x686d6a, 0.72));
      const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(4, 6, 5); key.castShadow = true; this.scene.add(key);
      const fill = new THREE.DirectionalLight(0xd7e0df, 0.7); fill.position.set(-5, 3, 2); this.scene.add(fill);
      const rim = new THREE.DirectionalLight(0xf1f4f0, 1.5); rim.position.set(-4, 2, -4); this.scene.add(rim);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.ShadowMaterial({ color: 0x555555, opacity: 0.16 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
      this.targetYaw = -0.62; this.targetPitch = 0.18; this.yaw = this.targetYaw; this.pitch = this.targetPitch;
      this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.$refs.stage);
      canvas.addEventListener("pointerdown", this.down); canvas.addEventListener("pointermove", this.move); canvas.addEventListener("pointerup", this.up); canvas.addEventListener("pointerleave", this.up); canvas.addEventListener("wheel", this.wheel, { passive: false });
    },
    mountModel(model) {
      const sourceBounds = new THREE.Box3().setFromObject(model);
      model.position.copy(sourceBounds.getCenter(new THREE.Vector3())).multiplyScalar(-1);
      model.scale.setScalar(1);
      model.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = true; node.receiveShadow = true;
        node.frustumCulled = false;
        if (!node.material) return;
        const name = node.material.name.toLowerCase();
        const metal = name.includes("aluminum") || name.includes("chrome");
        const glass = name.includes("clear") || name.includes("optical") || name.includes("camera");
        const controls = name.includes("black") || name.includes("carbon") || name.includes("stereolithography");
        const softGrey = name.includes("soft_rough_grey") || name.includes("soft rough grey");
        const softWhite = name.includes("soft_rough_white") || name.includes("soft rough white");
        const glow = name.includes("emissive");
        const material = new THREE.MeshPhysicalMaterial({
          color: controls ? 0x202526 : metal ? 0x757978 : glass ? 0x778385 : softGrey ? 0xb8bcba : 0xf0efeb,
          roughness: metal ? 0.22 : glass ? 0.12 : controls ? 0.2 : softGrey || softWhite ? 0.58 : 0.24,
          metalness: metal ? 0.9 : controls ? 0.42 : 0.02,
          transmission: glass ? 0.14 : 0,
          transparent: glass,
          opacity: glass ? 0.7 : 1,
          clearcoat: metal ? 0.18 : controls ? 0.72 : softGrey || softWhite ? 0.05 : 0.48,
          clearcoatRoughness: metal ? 0.16 : controls ? 0.12 : softGrey || softWhite ? 0.6 : 0.2,
          envMapIntensity: metal || controls ? 1.75 : glass ? 1.2 : softGrey ? 0.65 : 1.35,
          emissive: glow ? new THREE.Color(0xcaf7ff) : new THREE.Color(0x000000),
          emissiveIntensity: glow ? 1.1 : 0,
          side: THREE.DoubleSide
        });
        node.material.dispose();
        node.material = material;
      });
      this.model = new THREE.Group(); this.model.add(model); this.scene.add(this.model);
      const floorY = new THREE.Box3().setFromObject(this.model).min.y;
      this.scene.children.find(node => node.isMesh && node.material?.isShadowMaterial).position.y = floorY - 0.02;
    },
    resize() { if (!this.renderer) return; const rect = this.$refs.stage.getBoundingClientRect(); this.renderer.setSize(rect.width, rect.height, false); this.camera.aspect = rect.width / rect.height; this.camera.updateProjectionMatrix(); this.render(); },
    down(event) { this.dragging = true; this.pointer = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); },
    move(event) { if (!this.dragging) return; this.targetYaw += (event.clientX - this.pointer.x) * 0.008; this.targetPitch = Math.max(-0.45, Math.min(0.55, this.targetPitch + (event.clientY - this.pointer.y) * 0.006)); this.pointer = { x: event.clientX, y: event.clientY }; this.render(); },
    up() { this.dragging = false; },
    wheel(event) { event.preventDefault(); this.camera.position.z = Math.max(520, Math.min(1400, this.camera.position.z * Math.exp(event.deltaY * 0.001))); this.render(); },
    render() {
      if (!this.renderer || this.frame) return;
      const delta = Math.abs(this.targetYaw - this.yaw) + Math.abs(this.targetPitch - this.pitch);
      this.yaw += (this.targetYaw - this.yaw) * 0.12;
      this.pitch += (this.targetPitch - this.pitch) * 0.12;
      if (this.model) this.model.rotation.set(this.pitch, this.yaw, 0);
      this.renderer.render(this.scene, this.camera);
      if (this.dragging || delta > 0.0008) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
    },
    stop() {
      cancelAnimationFrame(this.frame); this.frame = 0; this.resizeObserver?.disconnect();
      if (this.model) this.model.traverse(node => { if (node.isMesh) { node.geometry?.dispose(); node.material?.dispose(); } });
      this.renderer?.dispose(); this.renderer = null; this.model = null;
    }
  },
  template: `
    <section v-if="desktop" class="driver-material-preview" aria-label="Interactive material preview">
      <header class="driver-material-preview__heading"><h2>{{ lang === 'zh' ? '材质光影' : 'Material and light' }}</h2><span>REAL-TIME</span></header>
      <div ref="stage" class="driver-material-preview__stage"><canvas ref="canvas"></canvas><div v-if="loading || failed" class="driver-material-preview__loading">{{ failed ? (lang === 'zh' ? '模型暂不可用' : 'Model unavailable') : (lang === 'zh' ? '正在加载材质模型' : 'Loading material model') }}</div><div class="driver-material-preview__meta"><span></span>{{ lang === 'zh' ? '驾驶游戏手柄 / 实时材质预览' : 'DRIVER HANDLE / REAL-TIME MATERIAL STUDY' }}</div><p class="driver-material-preview__hint">{{ lang === 'zh' ? '拖拽旋转 · 滚轮缩放' : 'DRAG TO ORBIT · SCROLL TO ZOOM' }}</p></div>
    </section>
  `
};
