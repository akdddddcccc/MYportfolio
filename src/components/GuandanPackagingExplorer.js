import "../styles/guandan-packaging-explorer.css";
import "../styles/guandan-packaging-hotspots.css";

const PARTS = [
  {
    id: "lid", position: { left: "58%", top: "9%" },
    asset: "/images/work/guandan-demo/box-top-suit-logo.svg", vector: true,
    zh: { name: "礼盒盖", idea: "以几何化的花色符号作为套装识别，控制盒盖表面的信息密度，让整体更像一件可收纳的桌面器物。", source: "高清 SVG · 牌盒顶部花色 logo。" },
    en: { name: "Gift-box lid", idea: "Geometric suit symbols create a restrained identity for the physical kit.", source: "High-resolution SVG · top suit logo." }
  },
  {
    id: "board", position: { left: "44%", top: "78%" },
    asset: "/images/work/guandan-demo/scoreboard.svg", vector: true,
    zh: { name: "积分板", idea: "把冲分与冲 A 过程放进同一块板面；棋子在格点上的位置，直接对应当前对局进度。", source: "高清 SVG · 可进入下方记分交互。" },
    en: { name: "Score board", idea: "A single board makes score progress and the race to A legible at a glance.", source: "High-resolution SVG · interactive below." }
  },
  {
    id: "cards", position: { left: "20%", top: "66%" },
    assets: ["/images/work/guandan-demo/deck-box-black.svg", "/images/work/guandan-demo/deck-box-white.svg"], vector: true, tall: true,
    zh: { name: "两副牌", idea: "黑白两组牌盒以同一套几何系统区分，同时保留掼蛋对局中成对收纳、成对取用的仪式感。展开图完整保留了正面、背面和侧面。", source: "高清 SVG · 黑白两套牌盒包装展开图。" },
    en: { name: "Two decks", idea: "The black and white deck boxes share a geometric language while staying visibly paired. The dielines retain every face and side.", source: "High-resolution SVG · black and white deck-box dielines." }
  }
];

export default {
  name: "GuandanPackagingExplorer",
  props: { lang: { type: String, required: true } },
  data() { return { selectedId: "board", boxVariant: 0, parts: PARTS.map((part) => ({ ...part, position: { ...part.position } })) }; },
  mounted() {
    try {
      const savedPositions = JSON.parse(window.localStorage.getItem("guandan-packaging-hotspots-v1") || "{}");
      this.parts.forEach((part) => { if (savedPositions[part.id]) part.position = savedPositions[part.id]; });
    } catch {}
  },
  computed: {
    selected() { return this.parts.find((part) => part.id === this.selectedId) || this.parts[0]; },
    selectedCopy() { return this.selected[this.lang === "zh" ? "zh" : "en"]; },
    activeAsset() { return this.selected.assets ? this.selected.assets[this.boxVariant] : this.selected.asset; },
    coordinateLabel() { return `${parseFloat(this.selected.position.left).toFixed(1)}%, ${parseFloat(this.selected.position.top).toFixed(1)}%`; },
    copy() { return this.lang === "zh" ? { eyebrow: "Packaging explorer", title: "点击套装，查看每一件设计部件", lead: "用无标注套装图定位部件；礼盒顶面和两副牌盒已接入高清 SVG，可直接查看完整包装平面。", select: "选择部件", vector: "高清矢量素材", render: "包装效果图局部", black: "黑方牌盒展开", white: "白方牌盒展开", adjust: "调整热点", finish: "完成调整", adjustHint: "拖动红点到准确位置，坐标会实时显示。", coordinates: "当前坐标", saved: "热点位置已保存" } : { eyebrow: "Packaging explorer", title: "Click the set to inspect each design part", lead: "The unannotated kit rendering locates each part. The lid graphic and both deck boxes are available as high-resolution SVGs.", select: "Select part", vector: "High-resolution vector asset", render: "Packaging-render detail", black: "Black deck-box dieline", white: "White deck-box dieline", adjust: "Adjust hotspots", finish: "Finish adjustment", adjustHint: "Drag a red point to its exact position.", coordinates: "Current position", saved: "Hotspot positions saved" }; }
  },
  methods: {
    select(id) { this.selectedId = id; this.boxVariant = 0; },
    setBoxVariant(index) { this.boxVariant = index; },
    toggleCalibration() {
      if (this.calibrating) {
        try { window.localStorage.setItem("guandan-packaging-hotspots-v1", JSON.stringify(Object.fromEntries(this.parts.map((part) => [part.id, part.position])))); this.positionsSaved = true; } catch {}
      }
      this.calibrating = !this.calibrating;
      this.draggingPartId = "";
    },
    startHotspotDrag(event, part) { if (!this.calibrating) return; this.draggingPartId = part.id; event.currentTarget.setPointerCapture?.(event.pointerId); },
    moveHotspot(event) { if (!this.draggingPartId) return; const rect = event.currentTarget.getBoundingClientRect(); const part = this.parts.find((item) => item.id === this.draggingPartId); if (!part) return; part.position = { left: `${Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100))}%`, top: `${Math.max(2, Math.min(98, ((event.clientY - rect.top) / rect.height) * 100))}%` }; },
    endHotspotDrag() { this.draggingPartId = ""; }
  },
  template: `
    <section class="guandan-packaging" :aria-label="copy.title">
      <header class="guandan-packaging__intro"><div><p class="guandan-demo__eyebrow">{{ copy.eyebrow }}</p><h2>{{ copy.title }}</h2><p>{{ copy.lead }}</p></div></header>
      <div class="guandan-packaging__layout">
        <div class="guandan-packaging__image" role="group" :aria-label="copy.select">
          <img src="/images/work/guandan-demo/packaging-interaction.png" alt="掼蛋套装：礼盒、积分板、两副牌和纸板内托" />
          <button v-for="part in parts" :key="part.id" type="button" class="guandan-packaging__hotspot" :class="{ active: selectedId === part.id }" :style="part.position" @click="select(part.id)" :aria-label="part[lang === 'zh' ? 'zh' : 'en'].name"></button>
        </div>
        <aside class="guandan-packaging__detail" aria-live="polite">
          <p class="guandan-demo__eyebrow">{{ selected.vector ? copy.vector : copy.render }}</p>
          <h3>{{ selectedCopy.name }}</h3><p class="guandan-packaging__idea">{{ selectedCopy.idea }}</p>
          <div v-if="selected.assets" class="guandan-packaging__asset-tabs"><button type="button" :class="{ active: boxVariant === 0 }" @click="setBoxVariant(0)">{{ copy.black }}</button><button type="button" :class="{ active: boxVariant === 1 }" @click="setBoxVariant(1)">{{ copy.white }}</button></div>
          <div class="guandan-packaging__asset" :class="{ 'guandan-packaging__asset--render': !selected.vector, 'guandan-packaging__asset--tall': selected.tall, 'guandan-packaging__asset--board': selected.id === 'board' }">
            <img :src="activeAsset" :alt="selectedCopy.name" />
          </div>
          <p class="guandan-packaging__source">{{ selectedCopy.source }}</p>
          <nav class="guandan-packaging__list" :aria-label="copy.select"><button v-for="part in parts" :key="part.id" type="button" :class="{ active: selectedId === part.id }" @click="select(part.id)">{{ part[lang === 'zh' ? 'zh' : 'en'].name }}</button></nav>
        </aside>
      </div>
    </section>
  `
};
