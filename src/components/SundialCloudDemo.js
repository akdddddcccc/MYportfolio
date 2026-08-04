import * as THREE from "three";

const CLOUD_URL = "/models/sundial-cloud.bin";

export default {
  name: "SundialCloudDemo",
  props: { lang: { type: String, required: true } },
  data() { return { desktop: false, loading: true, failed: false, density: 60000, pointScale: 0.85, inertia: 0.6 }; },
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
      try { const response = await fetch(CLOUD_URL); if (!response.ok) throw new Error(`Cloud unavailable: ${response.status}`); this.create(await this.parse(await response.arrayBuffer())); this.loading = false; }
      catch (error) { console.error(error); this.failed = true; this.loading = false; }
    },
    parse(buffer) {
      if (new TextDecoder().decode(buffer.slice(0, 4)) !== "SCF1") throw new Error("Invalid point cloud asset");
      const count = new DataView(buffer).getUint32(4, true); let offset = 8;
      const take = length => { const result = new Float32Array(buffer, offset, length); offset += length * 4; return result; };
      return { count, positions: take(count * 3), normals: take(count * 3), brightness: take(count), sizes: take(count), lag: take(count) };
    },
    create(cloud) {
      const canvas = this.$refs.canvas;
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20); this.camera.position.z = 3.75;
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "high-performance" });
      this.renderer.setClearColor(0x080808, 1); this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
      geometry.setAttribute("aBrightness", new THREE.BufferAttribute(cloud.brightness, 1));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(cloud.sizes, 1));
      this.yaw = new Float32Array(cloud.count).fill(-0.72); this.pitch = new Float32Array(cloud.count).fill(0.28); this.lag = cloud.lag;
      geometry.setAttribute("aYaw", new THREE.BufferAttribute(this.yaw, 1)); geometry.setAttribute("aPitch", new THREE.BufferAttribute(this.pitch, 1));
      this.yawAttribute = geometry.getAttribute("aYaw"); this.pitchAttribute = geometry.getAttribute("aPitch"); geometry.setDrawRange(0, this.density);
      this.material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.NormalBlending, uniforms: { pointScale: { value: this.pointScale } }, vertexShader: `
        attribute float aBrightness,aSize,aYaw,aPitch; uniform float pointScale; varying float glow;
        void main(){ float cy=cos(aYaw),sy=sin(aYaw),cp=cos(aPitch),sp=sin(aPitch); vec3 p=position; float x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp,d=p.y*sp+z*cp; vec4 view=modelViewMatrix*vec4(x,y,d,1.); gl_Position=projectionMatrix*view; gl_PointSize=max(.8,aSize*pointScale*(8./-view.z)); glow=aBrightness*(.78+d*.08); }
      `, fragmentShader: `precision mediump float; varying float glow; void main(){float d=length(gl_PointCoord-.5); float soft=1.-smoothstep(.12,.5,d); gl_FragColor=vec4(vec3(1.),glow*soft);}` });
      this.scene.add(new THREE.Points(geometry, this.material)); this.geometry = geometry; this.targetYaw = -0.72; this.targetPitch = 0.28;
      this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.$refs.stage);
      canvas.addEventListener("pointerdown", this.down); canvas.addEventListener("pointermove", this.move); canvas.addEventListener("pointerup", this.up); canvas.addEventListener("pointerleave", this.up); canvas.addEventListener("wheel", this.wheel, { passive: false });
      this.resize(); this.render();
    },
    resize() { if (!this.renderer) return; const rect = this.$refs.stage.getBoundingClientRect(); this.renderer.setSize(rect.width, rect.height, false); this.camera.aspect = rect.width / rect.height; this.camera.updateProjectionMatrix(); },
    down(event) { this.dragging = true; this.pointer = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); },
    move(event) { if (!this.dragging) return; this.targetYaw += (event.clientX - this.pointer.x) * .008; this.targetPitch = Math.max(-1.25, Math.min(1.25, this.targetPitch + (event.clientY - this.pointer.y) * .008)); this.pointer = { x: event.clientX, y: event.clientY }; this.render(); },
    up() { this.dragging = false; },
    wheel(event) { event.preventDefault(); this.camera.position.z = Math.max(2.2, Math.min(6.2, this.camera.position.z * Math.exp(event.deltaY * .001))); this.render(); },
    render() {
      if (!this.renderer || this.frame) return;
      this.frame = requestAnimationFrame(() => { this.frame = 0; let moving = false;
        for (let i = 0; i < this.yaw.length; i += 1) { const follow = (.04 + (1 - this.lag[i]) * .2) * (1.5 - this.inertia), delta = Math.atan2(Math.sin(this.targetYaw - this.yaw[i]), Math.cos(this.targetYaw - this.yaw[i])); this.yaw[i] += delta * follow; this.pitch[i] += (this.targetPitch - this.pitch[i]) * follow; moving ||= Math.abs(delta) + Math.abs(this.targetPitch - this.pitch[i]) > .0018; }
        this.yawAttribute.needsUpdate = true; this.pitchAttribute.needsUpdate = true; this.renderer.render(this.scene, this.camera); if (this.dragging || moving) this.render();
      });
    },
    stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.resizeObserver?.disconnect(); this.geometry?.dispose(); this.material?.dispose(); this.renderer?.dispose(); this.renderer = null; }
  },
  template: `
    <section v-if="desktop" class="sundial-cloud-demo" aria-label="Interactive Sundial point cloud">
      <header class="sundial-cloud-demo__heading"><h2>{{ lang === 'zh' ? '造型结构' : 'Form structure' }}</h2><span>Point Cloud</span></header>
      <div ref="stage" class="sundial-cloud-demo__stage"><canvas ref="canvas"></canvas><div v-if="loading || failed" class="sundial-cloud-demo__loading">{{ failed ? (lang === 'zh' ? '点云模型暂不可用' : 'Cloud unavailable') : (lang === 'zh' ? '正在生成日晷点云' : 'Preparing cloud model') }}</div><div class="sundial-cloud-demo__meta"><span></span>{{ lang === 'zh' ? '日晷 / 交互式点云实验' : 'SUNDIAL / INTERACTIVE CLOUD STUDY' }}</div><p class="sundial-cloud-demo__hint">{{ lang === 'zh' ? '拖拽旋转 · 滚轮缩放' : 'DRAG TO ORBIT · SCROLL TO ZOOM' }}</p></div>
    </section>
  `
};
