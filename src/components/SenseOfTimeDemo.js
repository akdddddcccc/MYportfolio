import "../styles/sense-of-time-demo.css";

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angularDistance = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const noiseValue = (index, seed) => {
  const value = Math.sin((index + seed * 17.137) * 12.9898 + seed * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};
const smoothNoise = (position, seed) => {
  const lower = Math.floor(position);
  const blend = position - lower;
  const eased = blend * blend * (3 - 2 * blend);
  return noiseValue(lower, seed) * (1 - eased) + noiseValue(lower + 1, seed) * eased;
};
const loopNoise = (position, period, seed) => {
  const wrapped = ((position % period) + period) % period;
  const lower = Math.floor(wrapped);
  const blend = wrapped - lower;
  const eased = blend * blend * (3 - 2 * blend);
  return noiseValue(lower, seed) * (1 - eased) + noiseValue((lower + 1) % period, seed) * eased;
};

export default {
  name: "SenseOfTimeDemo",
  props: { lang: { type: String, required: true } },
  data() {
    return {
      depressionLevel: 0,
      pointer: { x: 0.5, y: 0.5, angle: 0, speed: 0, dragging: false, nearRing: false, magnetism: 0, mode: "view" },
      dragOrigin: null,
      targetView: { yaw: -0.36, pitch: 0.28 },
      displayView: { yaw: -0.36, pitch: 0.28 },
      viewQueue: [],
      viewEchoes: [],
      hoverQueue: [],
      displayHover: { x: 0.5, y: 0.5, angle: 0, speed: 0, magnetism: 0 },
      impulses: [],
      pendingImpulses: [],
      frameId: 0,
      lastFrame: 0,
      lastViewInput: 0,
      lastImpulse: 0,
      quality: 1,
      renderer: "canvas",
      gl: null,
      glState: null,
      glContextLost: false,
      audioEnabled: false,
      audioError: false,
      audio: null
    };
  },
  computed: {
    depressionDepth() { return this.depressionLevel / 100; },
    stateLabel() {
      const level = this.depressionLevel;
      if (this.lang === "zh") return level < 16 ? "平常" : level < 42 ? "轻度" : level < 72 ? "中度" : "重度抑郁";
      return level < 16 ? "Everyday" : level < 42 ? "Mild" : level < 72 ? "Moderate" : "Severe depression";
    },
    interactionHint() {
      const shaping = this.pointer.dragging && this.pointer.mode === "shape";
      if (this.lang === "zh") {
        if (shaping) return "已吸附 · 径向拖动塑造波峰与波谷";
        if (this.pointer.dragging) return "观察模式 · 拖动改变立体视角";
        return this.pointer.nearRing ? "靠近边缘 · 拖动可塑造波形" : "远离圆环 · 拖动改变立体视角";
      }
      if (shaping) return "Attached · drag radially to shape peaks and troughs";
      if (this.pointer.dragging) return "View mode · drag to change the spatial view";
      return this.pointer.nearRing ? "Near the edge · drag to shape the waveform" : "Away from the ring · drag to change the spatial view";
    },
    copy() {
      return this.lang === "zh"
        ? {
            kicker: "Interactive sound + motion study",
            title: "时感 / Sense of Time",
            lead: "按住拖动，以立体视角观察波形环。滑块决定时间反馈的迟滞、细线分裂、噪波与声音的失序程度。",
            soundOn: "开启声音", soundOff: "关闭声音", soundHint: "声音由浏览器实时生成，请点击开启。", soundError: "声音未能启用，请检查浏览器是否静音。",
            instruction: "按住拖动以观察立体波形", state: "当前状态", everyday: "平常", severe: "重度抑郁", slider: "抑郁程度"
          }
        : {
            kicker: "Interactive sound + motion study",
            title: "Sense of Time",
            lead: "Drag to explore the waveform as a spatial object. The slider controls delay, line splitting, noise and sonic disorder.",
            soundOn: "Enable sound", soundOff: "Mute sound", soundHint: "Sound is generated in the browser. Click to enable.", soundError: "Sound could not start. Check browser mute settings.",
            instruction: "Hold and drag to explore the spatial waveform", state: "Current state", everyday: "Everyday", severe: "Severe depression", slider: "Depression level"
          };
    }
  },
  mounted() {
    this.resizeCanvas();
    this.initializeWebGL();
    window.addEventListener("resize", this.resizeCanvas);
    this.$refs.webglCanvas.addEventListener("webglcontextlost", this.handleContextLost, false);
    this.$refs.webglCanvas.addEventListener("webglcontextrestored", this.handleContextRestored, false);
    this.frameId = window.requestAnimationFrame(this.renderFrame);
  },
  beforeUnmount() {
    window.cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.resizeCanvas);
    this.$refs.webglCanvas?.removeEventListener("webglcontextlost", this.handleContextLost);
    this.$refs.webglCanvas?.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.destroyWebGL();
    this.stopAudio();
  },
  methods: {
    resizeCanvas() {
      const canvas = this.$refs.canvas;
      const webglCanvas = this.$refs.webglCanvas;
      const stage = this.$refs.stage;
      if (!canvas || !webglCanvas || !stage) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = stage.getBoundingClientRect();
      [canvas, webglCanvas].forEach((target) => {
        target.width = Math.max(1, Math.round(rect.width * ratio));
        target.height = Math.max(1, Math.round(rect.height * ratio));
        target.style.width = `${rect.width}px`;
        target.style.height = `${rect.height}px`;
      });
      if (this.gl) this.gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
    },
    compileWebGLShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || "WebGL shader compilation failed");
      }
      return shader;
    },
    initializeWebGL() {
      const canvas = this.$refs.webglCanvas;
      if (!canvas || this.glContextLost) return false;
      try {
        const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" }) || canvas.getContext("experimental-webgl");
        if (!gl) return false;
        const vertexSource = `
          precision highp float;
          attribute float aAngle; attribute float aRadial; attribute float aZ; attribute float aLayer;
          uniform vec2 uResolution; uniform vec2 uView; uniform float uTime; uniform float uDepression; uniform float uOpacity; uniform float uLinePass; uniform vec3 uHover;
          uniform vec4 uImpulses[3];
          varying float vAlpha;
          const float TAU = 6.28318530718;
          float valueNoise(float i, float seed) { return fract(sin((i + seed * 17.137) * 12.9898 + seed * 78.233) * 43758.5453) * 2.0 - 1.0; }
          float loopNoise(float x, float period, float seed) { x = mod(mod(x, period) + period, period); float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(valueNoise(i, seed), valueNoise(mod(i + 1.0, period), seed), f); }
          float angleDistance(float a, float b) { return atan(sin(a - b), cos(a - b)); }
          void main() {
            float phase = aAngle / TAU; float drift = uTime * 0.00013;
            float broad = loopNoise(phase * 5.0 - drift, 5.0, aLayer * 0.71);
            float middle = loopNoise(phase * 13.0 + drift * 1.8, 13.0, aLayer * 1.33);
            float fine = loopNoise(phase * 31.0 - drift * 3.2, 31.0, aLayer * 2.07);
            float peak = max(0.0, loopNoise(phase * 9.0 - drift * 0.62, 9.0, aLayer * 3.17));
            float trough = max(0.0, -loopNoise(phase * 7.0 + drift * 0.91, 7.0, aLayer * 4.21));
            float regular = sin(aAngle * 5.0 + uTime * 0.0017 + aLayer * 0.14) * 4.0 + sin(aAngle * 2.0 - uTime * 0.0008) * 2.6;
            float radialWave = regular * (1.0 - uDepression * 0.58) + (broad * 10.0 + middle * 6.0 + fine * 2.4 + pow(peak, 4.0) * 26.0 - pow(trough, 4.0) * 22.0) * (0.14 + uDepression * 0.94);
            float hover = exp(-pow(angleDistance(aAngle, uHover.x), 2.0) / 0.15) * uHover.y * (5.6 + uHover.z * 15.0);
            radialWave += hover;
            float vertical = sin(aAngle * 4.0 - uTime * 0.0011 + aLayer * 0.37) * 2.4 * (1.0 - uDepression * 0.45);
            vertical += (loopNoise(phase * 6.0 + uTime * 0.00011, 6.0, aLayer * 1.73) * 7.5 + pow(max(0.0, loopNoise(phase * 11.0 - uTime * 0.000165, 11.0, aLayer * 2.81)), 4.0) * 19.0 + loopNoise(phase * 23.0 + uTime * 0.00034, 23.0, aLayer * 4.07) * 2.2) * (0.14 + uDepression * 0.9) + hover * 0.38;
            for (int i = 0; i < 3; i++) { vec4 impulse = uImpulses[i]; float d = angleDistance(aAngle, impulse.x); radialWave += impulse.y * 43.0 * exp(-(d * d) / (0.018 + uDepression * 0.032)) * impulse.z; vertical += impulse.y * 18.0 * exp(-(d * d) / (0.026 + uDepression * 0.04)) * impulse.z; }
            float base = min(uResolution.x, uResolution.y) * 0.23;
            float radius = base * (0.72 + aRadial * 0.44) + radialWave * (0.56 + aRadial * 0.62);
            float z = (aZ - 0.5) * base * (0.22 + uDepression * 0.45) + vertical * (0.58 + aRadial * 0.52);
            float x = cos(aAngle) * radius; float y = sin(aAngle) * radius;
            float cy = cos(uView.x); float sy = sin(uView.x); float cp = cos(uView.y); float sp = sin(uView.y);
            float rx = x * cy + z * sy; float rz = -x * sy + z * cy; float ry = y * cp - rz * sp; float depth = y * sp + rz * cp;
            float scale = min(uResolution.x, uResolution.y) * 2.2 / (min(uResolution.x, uResolution.y) * 2.2 + depth);
            vec2 screen = vec2(rx * scale, ry * scale);
            gl_Position = vec4(screen.x / (uResolution.x * 0.5), screen.y / (uResolution.y * 0.5), 0.0, 1.0);
            gl_PointSize = mix(3.15, 4.6, uDepression);
            float pointAlpha = 0.23 + aRadial * 0.11 + uDepression * 0.055;
            float lineAlpha = 0.09 + aRadial * 0.045 + uDepression * 0.025;
            vAlpha = uOpacity * mix(pointAlpha, lineAlpha, uLinePass);
          }`;
        const fragmentSource = `
          precision mediump float; varying float vAlpha; uniform float uLinePass;
          void main() { float d = length(gl_PointCoord - vec2(0.5)); float edge = mix(1.0 - smoothstep(0.16, 0.5, d), 1.0, uLinePass); gl_FragColor = vec4(vec3(0.96), vAlpha * edge); }`;
        const program = gl.createProgram();
        const vertex = this.compileWebGLShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragment = this.compileWebGLShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        gl.deleteShader(vertex); gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "WebGL program linking failed");
        const mobile = window.matchMedia?.("(max-width: 780px)").matches;
        const createLod = (angular, radial, zBands) => {
          const points = new Float32Array(angular * radial * zBands * 4);
          let offset = 0;
          for (let z = 0; z < zBands; z += 1) for (let r = 0; r < radial; r += 1) for (let a = 0; a < angular; a += 1) {
            points[offset++] = a / angular * TAU; points[offset++] = r / Math.max(1, radial - 1); points[offset++] = z / Math.max(1, zBands - 1); points[offset++] = z * radial + r;
          }
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
          return { buffer, count: angular * radial * zBands, angular, radial, zBands };
        };
        const lods = mobile
          ? { smooth: createLod(220, 10, 6), fractured: createLod(84, 8, 5) }
          : { smooth: createLod(360, 13, 8), fractured: createLod(112, 10, 6) };
        this.gl = gl;
        this.glState = { program, lods, attributes: ["aAngle", "aRadial", "aZ", "aLayer"], uniforms: ["uResolution", "uView", "uTime", "uDepression", "uOpacity", "uLinePass", "uHover", "uImpulses"] };
        this.renderer = "webgl";
        this.resizeCanvas();
        return true;
      } catch (error) {
        this.destroyWebGL();
        this.renderer = "canvas";
        return false;
      }
    },
    destroyWebGL() {
      if (!this.gl || !this.glState) return;
      Object.values(this.glState.lods || {}).forEach((lod) => this.gl.deleteBuffer(lod.buffer));
      this.gl.deleteProgram(this.glState.program);
      this.gl = null; this.glState = null;
    },
    handleContextLost(event) { event.preventDefault(); this.glContextLost = true; this.gl = null; this.glState = null; this.renderer = "lost"; },
    handleContextRestored() { this.glContextLost = false; this.initializeWebGL(); },
    updatePointer(event) {
      const rect = this.$refs.stage.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const distance = Math.hypot(x - this.pointer.x, y - this.pointer.y);
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const centerX = rect.width * 0.5;
      const centerY = rect.height * 0.51;
      const radialX = localX - centerX;
      const radialY = localY - centerY;
      const radialLength = Math.hypot(radialX, radialY);
      const ringRadius = Math.min(rect.width, rect.height) * 0.23;
      const captureRadius = Math.max(30, ringRadius * 0.22);
      const innerRadius = ringRadius * 0.62;
      const outerRadius = ringRadius * 1.24;
      const ringDistance = radialLength < innerRadius ? innerRadius - radialLength : radialLength > outerRadius ? radialLength - outerRadius : 0;
      const magnetism = 1 - clamp(ringDistance / captureRadius, 0, 1);
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.angle = Math.atan2(radialY, radialX);
      this.pointer.speed = this.pointer.speed * 0.76 + Math.min(1, distance * 28) * 0.24;
      this.pointer.magnetism = magnetism;
      this.pointer.nearRing = magnetism > 0.04;
      this.enqueueHover();

      if (!this.pointer.dragging || !this.dragOrigin) return;
      const now = performance.now();
      if (this.pointer.mode === "shape") {
        const movedX = event.clientX - this.dragOrigin.lastX;
        const movedY = event.clientY - this.dragOrigin.lastY;
        this.dragOrigin.lastX = event.clientX;
        this.dragOrigin.lastY = event.clientY;
        const unitX = radialLength ? radialX / radialLength : 0;
        const unitY = radialLength ? radialY / radialLength : 0;
        const radialMotion = movedX * unitX + movedY * unitY;
        if (Math.abs(radialMotion) > 0.35 && now - this.lastImpulse > 48) {
          this.lastImpulse = now;
          this.enqueueImpulse(this.pointer.angle, clamp(radialMotion / ringRadius * 5.2, -0.66, 0.66));
        }
        return;
      }
      this.targetView = {
        yaw: this.dragOrigin.yaw + (event.clientX - this.dragOrigin.x) * 0.007,
        pitch: clamp(this.dragOrigin.pitch + (event.clientY - this.dragOrigin.y) * 0.006, -0.72, 0.72)
      };
      if (now - this.lastViewInput > 46) {
        this.lastViewInput = now;
        this.enqueueView(this.targetView);
      }
    },
    startDrag(event) {
      this.updatePointer(event);
      this.pointer.dragging = true;
      this.pointer.mode = this.pointer.nearRing ? "shape" : "view";
      this.dragOrigin = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, yaw: this.targetView.yaw, pitch: this.targetView.pitch };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      if (this.pointer.mode === "shape") this.enqueueImpulse(this.pointer.angle, 0.18);
    },
    endDrag(event) {
      this.pointer.dragging = false;
      this.pointer.mode = "view";
      this.dragOrigin = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    enqueueView(view) {
      const depth = this.depressionDepth;
      const payload = { ...view, createdAt: performance.now() };
      if (depth < 0.02) this.applyView(payload);
      else this.viewQueue.push({ ...payload, readyAt: performance.now() + 90 + depth * 760 });
    },
    enqueueHover() {
      const payload = { x: this.pointer.x, y: this.pointer.y, angle: this.pointer.angle, speed: this.pointer.speed, magnetism: this.pointer.magnetism };
      const depth = this.depressionDepth;
      if (depth < 0.02) this.displayHover = payload;
      else {
        this.hoverQueue.push({ ...payload, readyAt: performance.now() + 80 + depth * 720 });
        if (this.hoverQueue.length > 10) this.hoverQueue.splice(0, this.hoverQueue.length - 10);
      }
    },
    applyView(view) {
      if (this.depressionDepth > 0.08) {
        this.viewEchoes.push({ ...this.displayView, createdAt: performance.now(), ttl: 180 + this.depressionDepth * 1200 });
        if (this.viewEchoes.length > 4) this.viewEchoes.splice(0, this.viewEchoes.length - 4);
      }
      this.displayView = { yaw: view.yaw, pitch: view.pitch };
    },
    enqueueImpulse(angle, strength) {
      const depth = this.depressionDepth;
      const payload = { angle, strength, depth, createdAt: performance.now(), ttl: 2200 };
      if (depth < 0.02) this.commitImpulse(payload);
      else this.pendingImpulses.push({ ...payload, readyAt: performance.now() + 90 + depth * 720 });
    },
    commitImpulse(impulse) {
      this.impulses.push(impulse);
      if (this.impulses.length > 16) this.impulses.splice(0, this.impulses.length - 16);
      this.playGestureSound(impulse);
    },
    drainState(now) {
      this.viewQueue = this.viewQueue.filter((view) => {
        if (view.readyAt > now) return true;
        this.applyView(view);
        return false;
      });
      this.hoverQueue = this.hoverQueue.filter((hover) => {
        if (hover.readyAt > now) return true;
        this.displayHover = hover;
        return false;
      });
      this.pendingImpulses = this.pendingImpulses.filter((impulse) => {
        if (impulse.readyAt > now) return true;
        this.commitImpulse(impulse);
        return false;
      });
      this.impulses = this.impulses.filter((impulse) => now - impulse.createdAt < impulse.ttl);
      this.viewEchoes = this.viewEchoes.filter((view) => now - view.createdAt < view.ttl);
    },
    waveOffset(angle, time, layer, depth) {
      const regular = Math.sin(angle * 5 + time * 0.0017 + layer * 0.14) * 4 + Math.sin(angle * 2 - time * 0.0008) * 2.6;
      const phase = angle / TAU;
      const drift = time * 0.00013;
      const broad = loopNoise(phase * 5 - drift, 5, layer * 0.71);
      const middle = loopNoise(phase * 13 + drift * 1.8, 13, layer * 1.33);
      const fine = loopNoise(phase * 31 - drift * 3.2, 31, layer * 2.07);
      const peakSeed = loopNoise(phase * 9 - drift * 0.62, 9, layer * 3.17);
      const troughSeed = loopNoise(phase * 7 + drift * 0.91, 7, layer * 4.21);
      const irregular = broad * 10 + middle * 6 + fine * 2.4 + Math.max(0, peakSeed) ** 4 * 26 - Math.max(0, -troughSeed) ** 4 * 22;
      const hover = Math.exp(-(angularDistance(angle, this.displayHover.angle) ** 2) / 0.15) * this.displayHover.magnetism * (5.6 + this.displayHover.speed * 15);
      const impulses = this.impulses.reduce((sum, impulse) => {
        const age = clamp((time - impulse.createdAt) / impulse.ttl, 0, 1);
        const spread = 0.018 + depth * 0.032;
        return sum + impulse.strength * 43 * Math.exp(-(angularDistance(angle, impulse.angle) ** 2) / spread) * ((1 - age) ** 1.7);
      }, 0);
      return regular * (1 - depth * 0.58) + irregular * (0.14 + depth * 0.94) + hover + impulses;
    },
    verticalOffset(angle, time, layer, depth) {
      const phase = angle / TAU;
      const drift = time * 0.00011;
      const regular = Math.sin(angle * 4 - time * 0.0011 + layer * 0.37) * 2.4;
      const broad = loopNoise(phase * 6 + drift, 6, layer * 1.73);
      const peak = Math.max(0, loopNoise(phase * 11 - drift * 1.5, 11, layer * 2.81));
      const fine = loopNoise(phase * 23 + drift * 3.1, 23, layer * 4.07);
      return regular * (1 - depth * 0.45) + (broad * 7.5 + peak ** 4 * 19 + fine * 2.2) * (0.14 + depth * 0.9);
    },
    projectPoint(x, y, z, view, focal) {
      const cosYaw = Math.cos(view.yaw);
      const sinYaw = Math.sin(view.yaw);
      const cosPitch = Math.cos(view.pitch);
      const sinPitch = Math.sin(view.pitch);
      const rotatedX = x * cosYaw + z * sinYaw;
      const rotatedZ = -x * sinYaw + z * cosYaw;
      const rotatedY = y * cosPitch - rotatedZ * sinPitch;
      const depth = y * sinPitch + rotatedZ * cosPitch;
      const scale = focal / (focal + depth);
      return { x: rotatedX * scale, y: rotatedY * scale, depth };
    },
    drawLayer(ctx, width, height, time, base, radialIndex, radialCount, zIndex, zCount, view, depth, opacity, segments, variant = false) {
      const focal = Math.min(width, height) * 2.2;
      const radialProgress = radialCount <= 1 ? 0.5 : radialIndex / (radialCount - 1);
      const zProgress = zCount <= 1 ? 0.5 : zIndex / (zCount - 1);
      const baseRadius = base * (0.72 + radialProgress * 0.44);
      const layer = zIndex * radialCount + radialIndex;
      ctx.beginPath();
      for (let index = 0; index <= segments; index += 1) {
        const rawAngle = (index / segments) * TAU;
        const angleOffset = variant * (0.004 + depth * 0.014) * Math.sin(rawAngle * (9 + (layer % 5)) + time * 0.006 + layer * 0.73);
        const angle = rawAngle + angleOffset;
        const fineInterference = variant * (
          Math.sin(rawAngle * 29 - time * 0.009 + layer * 1.9) * (1.5 + depth * 3.8) +
          Math.sin(rawAngle * 47 + time * 0.014 - zIndex) * depth * 2.7
        );
        const radius = baseRadius + this.waveOffset(angle, time, layer, depth) * (0.56 + radialProgress * 0.62) + (zProgress - 0.5) * depth * 5 + fineInterference;
        const z = (zProgress - 0.5) * base * (0.22 + depth * 0.45) + this.verticalOffset(angle, time, layer, depth) * (0.58 + radialProgress * 0.52) + variant * Math.sin(rawAngle * 37 + layer) * (0.7 + depth * 2.8);
        const point = this.projectPoint(Math.cos(angle) * radius, Math.sin(angle) * radius, z, view, focal);
        const x = width * 0.5 + point.x;
        const y = height * 0.51 + point.y;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(248, 248, 244, ${opacity * (variant ? 0.58 : 1)})`;
      ctx.lineWidth = variant ? 0.34 : layer % 8 === 0 ? 1.05 : 0.56;
      ctx.stroke();
    },
    drawSurface(ctx, width, height, time, view, depth, opacity, echo = false) {
      const segmentBase = this.quality < 0.8 ? 112 : 148;
      const segments = segmentBase + Math.round(depth * 42);
      const radialBands = Math.max(11, Math.round((13 + depth * 3) * this.quality));
      const zBands = Math.max(5, Math.round((6 + depth * 6) * this.quality));
      const stride = echo ? 2 : 1;
      const base = Math.min(width, height) * 0.23;
      for (let zIndex = 0; zIndex < zBands; zIndex += 1) {
        for (let radialIndex = 0; radialIndex < radialBands; radialIndex += stride) {
          const layer = zIndex * radialBands + radialIndex;
          const layerOpacity = opacity * (0.3 + 0.7 * (radialIndex / Math.max(1, radialBands - 1)));
          this.drawLayer(ctx, width, height, time - layer * (6 + depth * 10), base, radialIndex, radialBands, zIndex, zBands, view, depth, layerOpacity, segments);
          if (!echo && this.pointer.dragging && this.pointer.mode === "shape" && radialIndex % 2 === 0) {
            this.drawLayer(ctx, width, height, time - layer * (5 + depth * 7) - 18, base, radialIndex, radialBands, zIndex, zBands, view, depth, layerOpacity, segments, true);
          }
        }
      }
    },
    drawMagnetCue(ctx, width, height) {
      if (this.displayHover.magnetism < 0.04) return;
      const x = this.displayHover.x * width;
      const y = this.displayHover.y * height;
      const radius = 9 + this.displayHover.magnetism * 14;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.strokeStyle = `rgba(255,255,255,${0.07 + this.displayHover.magnetism * 0.24})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
    drawWebGLSurface(time, view, opacity) {
      const { gl, glState } = this;
      if (!gl || !glState) return;
      const canvas = this.$refs.webglCanvas;
      const lod = this.depressionDepth > 0.38 || this.quality < 0.8 ? glState.lods.fractured : glState.lods.smooth;
      gl.useProgram(glState.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, lod.buffer);
      const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
      glState.attributes.forEach((name, index) => {
        const location = gl.getAttribLocation(glState.program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 1, gl.FLOAT, false, stride, index * Float32Array.BYTES_PER_ELEMENT);
      });
      gl.uniform2f(gl.getUniformLocation(glState.program, "uResolution"), canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(glState.program, "uView"), view.yaw, view.pitch);
      gl.uniform1f(gl.getUniformLocation(glState.program, "uTime"), time);
      gl.uniform1f(gl.getUniformLocation(glState.program, "uDepression"), this.depressionDepth);
      gl.uniform1f(gl.getUniformLocation(glState.program, "uOpacity"), opacity);
      gl.uniform3f(gl.getUniformLocation(glState.program, "uHover"), this.displayHover.angle, this.displayHover.magnetism, this.displayHover.speed);
      const impulseData = new Float32Array(12);
      this.impulses.slice(-3).forEach((impulse, index) => {
        const age = clamp((time - impulse.createdAt) / impulse.ttl, 0, 1);
        impulseData[index * 4] = impulse.angle;
        impulseData[index * 4 + 1] = impulse.strength;
        impulseData[index * 4 + 2] = (1 - age) ** 1.7;
      });
      gl.uniform4fv(gl.getUniformLocation(glState.program, "uImpulses[0]"), impulseData);
      gl.uniform1f(gl.getUniformLocation(glState.program, "uLinePass"), 0);
      gl.drawArrays(gl.POINTS, 0, lod.count);
      gl.uniform1f(gl.getUniformLocation(glState.program, "uLinePass"), 1);
      gl.lineWidth(1);
      for (let zIndex = 0; zIndex < lod.zBands; zIndex += 1) {
        for (let radialIndex = 0; radialIndex < lod.radial; radialIndex += 2) {
          const start = (zIndex * lod.radial + radialIndex) * lod.angular;
          gl.drawArrays(gl.LINE_LOOP, start, lod.angular);
        }
      }
    },
    renderWebGL(time) {
      const { gl } = this;
      if (!gl) { this.frameId = window.requestAnimationFrame(this.renderFrame); return; }
      const elapsed = this.lastFrame ? time - this.lastFrame : 16;
      this.lastFrame = time;
      this.quality = elapsed > 34 ? 0.7 : elapsed > 24 ? 0.84 : Math.min(1, this.quality + 0.015);
      this.drainState(time);
      gl.viewport(0, 0, this.$refs.webglCanvas.width, this.$refs.webglCanvas.height);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0.018, 0.018, 0.02, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.viewEchoes.slice(-2).forEach((view) => {
        const age = (time - view.createdAt) / view.ttl;
        this.drawWebGLSurface(time - age * 190, view, (1 - age) * this.depressionDepth * 0.22);
      });
      this.drawWebGLSurface(time, this.displayView, 1);
      this.frameId = window.requestAnimationFrame(this.renderFrame);
    },
    renderFrame(time) {
      if (this.renderer === "webgl") return this.renderWebGL(time);
      if (this.renderer === "lost") { this.frameId = window.requestAnimationFrame(this.renderFrame); return; }
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) { this.frameId = window.requestAnimationFrame(this.renderFrame); return; }
      const ratio = canvas.width / Math.max(1, canvas.clientWidth);
      const width = canvas.width / ratio;
      const height = canvas.height / ratio;
      const elapsed = this.lastFrame ? time - this.lastFrame : 16;
      this.lastFrame = time;
      this.quality = elapsed > 31 ? 0.68 : elapsed > 23 ? 0.82 : Math.min(1, this.quality + 0.015);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.drainState(time);
      const depth = this.depressionDepth;
      ctx.fillStyle = "#070707";
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width * 0.5, height * 0.51, 0, width * 0.5, height * 0.51, Math.min(width, height) * 0.46);
      glow.addColorStop(0, `rgba(255,255,255,${0.025 + depth * 0.035})`);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      this.viewEchoes.forEach((view) => {
        const age = (time - view.createdAt) / view.ttl;
        this.drawSurface(ctx, width, height, time - age * 190, view, depth, (1 - age) * depth * 0.19, true);
      });
      this.drawSurface(ctx, width, height, time, this.displayView, depth, 0.68, false);
      this.drawMagnetCue(ctx, width, height);
      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.2, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
      vignette.addColorStop(0.36, "rgba(0,0,0,0)");
      vignette.addColorStop(1, `rgba(0,0,0,${0.4 + depth * 0.5})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      this.frameId = window.requestAnimationFrame(this.renderFrame);
    },
    async toggleAudio() {
      if (this.audioEnabled) return this.stopAudio();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.audioError = true;
        return;
      }
      try {
        const context = new AudioContext();
        await context.resume();
        const master = context.createGain();
        const filter = context.createBiquadFilter();
        const delay = context.createDelay(1.5);
        const feedback = context.createGain();
        const noiseFilter = context.createBiquadFilter();
        const noiseGain = context.createGain();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = Math.random() * 2 - 1;
        const noise = context.createBufferSource();
        noise.buffer = noiseBuffer; noise.loop = true;
        // Start audibly after the explicit click; the subtle texture is added afterwards.
        master.gain.value = 0.52;
        filter.type = "lowpass"; filter.frequency.value = 6200;
        delay.delayTime.value = 0.12; feedback.gain.value = 0.12;
        noiseFilter.type = "lowpass"; noiseFilter.frequency.value = 2400; noiseGain.gain.value = 0.002;
        master.connect(filter); filter.connect(context.destination); filter.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(context.destination);
        noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master); noise.start();
        this.audio = { context, master, filter, delay, feedback, noise, noiseGain, noiseFilter, nextBeat: context.currentTime + 0.25, beatIndex: 1, timer: null };
        this.audioError = false;
        this.audioEnabled = true;
        this.scheduleTone({ frequency: 329.63, start: context.currentTime + 0.01, duration: 0.42, gain: 0.19, type: "triangle" });
        this.audio.timer = window.setInterval(this.scheduleAmbient, 80);
        this.scheduleAmbient();
      } catch (error) {
        this.audioError = true;
        this.audioEnabled = false;
      }
    },
    stopAudio() {
      if (!this.audio) return;
      window.clearInterval(this.audio.timer);
      this.audio.context.close();
      this.audio = null;
      this.audioEnabled = false;
    },
    scheduleTone({ frequency, start, duration, gain, detune = 0, type = "sine" }) {
      if (!this.audio) return;
      const partials = [{ ratio: 1, gain: 1, shape: type }, { ratio: 2.01, gain: 0.22, shape: "sine" }, { ratio: 3.04, gain: 0.09, shape: "triangle" }];
      partials.forEach((partial) => {
        const oscillator = this.audio.context.createOscillator();
        const envelope = this.audio.context.createGain();
        oscillator.type = partial.shape; oscillator.frequency.value = frequency * partial.ratio; oscillator.detune.value = detune * partial.ratio;
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * partial.gain), start + 0.012);
        envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * partial.gain * 0.18), start + Math.min(0.12, duration * 0.28));
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(envelope); envelope.connect(this.audio.master);
        oscillator.start(start); oscillator.stop(start + duration + 0.05);
      });
    },
    scheduleAmbient() {
      if (!this.audio) return;
      const { context } = this.audio;
      const depth = this.depressionDepth;
      const interval = 60 / (100 - depth * 42) / 2;
      this.audio.filter.frequency.setTargetAtTime(6200 - depth * 4700, context.currentTime, 0.12);
      this.audio.delay.delayTime.setTargetAtTime(0.16 + depth * 0.52, context.currentTime, 0.12);
      this.audio.feedback.gain.setTargetAtTime(0.14 + depth * 0.4, context.currentTime, 0.12);
      this.audio.noiseGain.gain.setTargetAtTime(0.001 + depth * depth * 0.045, context.currentTime, 0.16);
      while (this.audio.nextBeat < context.currentTime + 0.15) {
        const harmony = [[220, 277.18, 329.63, 415.3], [196, 246.94, 293.66, 369.99], [174.61, 220, 261.63, 329.63], [164.81, 207.65, 246.94, 311.13]];
        const chord = harmony[Math.floor(this.audio.beatIndex / 4) % harmony.length];
        const noteIndex = [0, 2, 1, 3, 2, 1][this.audio.beatIndex % 6];
        this.scheduleTone({ frequency: chord[noteIndex], start: this.audio.nextBeat, duration: interval * (0.94 + depth * 0.32), gain: 0.14, detune: depth * ((this.audio.beatIndex % 2 ? 1 : -1) * 23), type: depth > 0.45 ? "triangle" : "sine" });
        this.audio.nextBeat += interval;
        this.audio.beatIndex += 1;
      }
    },
    playGestureSound(impulse) {
      if (!this.audio) return;
      const now = this.audio.context.currentTime;
      const note = 280 + ((impulse.angle + Math.PI) / TAU) * 280 + impulse.strength * 90;
      this.scheduleTone({ frequency: Math.max(100, note), start: now, duration: 0.22 + impulse.depth * 0.23, gain: 0.12, detune: impulse.depth * -24 });
      if (impulse.depth > 0.22) [0.2, 0.45].forEach((offset, index) => this.scheduleTone({ frequency: Math.max(90, note * (index ? 0.74 : 0.9)), start: now + offset + impulse.depth * 0.12, duration: 0.25 + impulse.depth * 0.3, gain: 0.032, detune: (index + 1) * -18, type: "triangle" }));
    }
  },
  template: `
    <section class="sense-time-demo" aria-labelledby="sense-time-demo-title">
      <div ref="stage" class="sense-time-demo__stage" :class="{ 'is-dragging': pointer.dragging, 'is-near-ring': pointer.nearRing, 'is-shaping': pointer.dragging && pointer.mode === 'shape' }" @pointermove="updatePointer" @pointerdown="startDrag" @pointerup="endDrag" @pointercancel="endDrag">
        <canvas ref="canvas" class="sense-time-demo__canvas sense-time-demo__canvas--fallback" :class="{ 'is-hidden': renderer === 'webgl' }" aria-hidden="true"></canvas>
        <canvas ref="webglCanvas" class="sense-time-demo__canvas sense-time-demo__canvas--webgl" :class="{ 'is-active': renderer === 'webgl' }" aria-hidden="true"></canvas>
        <header class="sense-time-demo__intro"><p>{{ copy.kicker }}</p><h2 id="sense-time-demo-title">{{ copy.title }}</h2><span>{{ copy.lead }}</span></header>
        <div class="sense-time-demo__controls"><button type="button" class="sense-time-demo__sound" :aria-pressed="audioEnabled" @pointerdown.stop @pointerup.stop @click.stop="toggleAudio"><span class="sense-time-demo__sound-dot"></span>{{ audioEnabled ? copy.soundOff : copy.soundOn }}</button><p>{{ audioError ? copy.soundError : interactionHint }}</p></div>
        <p class="sense-time-demo__readout"><span>{{ copy.state }}</span>{{ stateLabel }}</p>
        <label class="sense-time-demo__slider"><span class="sense-time-demo__slider-title">{{ copy.slider }}</span><span>{{ copy.everyday }}</span><input v-model.number="depressionLevel" type="range" min="0" max="100" step="1" :aria-label="copy.slider" @pointerdown.stop @pointermove.stop @pointerup.stop><span>{{ copy.severe }}</span></label>
      </div>
    </section>
  `
};
