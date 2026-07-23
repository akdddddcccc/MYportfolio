const branches = [
  { id: "top", color: "#d99699", angle: -87 },
  { id: "right", color: "#d99699", angle: -15 },
  { id: "bottom-right", color: "#7186c7", angle: 57 },
  { id: "bottom-left", color: "#9eb2e4", angle: 129 },
  { id: "left", color: "#b2768e", angle: 201 }
];

const prices = [5.8, 2, 4.4, 3.2, 6.2, 3.4, 5.1, 2.8, 4.7, 1.8, 6.8, 3.8, 2.4, 5.4, 7.2, 4.1, 2.9, 6.1, 3.6, 5.9, 1.5, 8, 2.7, 4.8, 6.5, 3.3, 1.7, 5, 2.2, 4.6, 3.9, 5.3, 2.6, 6.7, 4.9, 3.1, 7.4, 2.2, 4.5, 5.6, 1.9, 6.4, 3.7, 5.2, 2.5, 7.1, 4.3, 2.9, 6.6, 3.5, 5.7, 2.1, 7.8, 4.6, 3.8, 6.9, 2.4, 5.4, 3.2, 6.1];
const contributors = [5, 8, 12, 19, 26, 35, 44, 54, 64, 75];
const institutions = [
  { name: "Huahan plastic surgery", values: [4, 8, 13, 20, 29] }, { name: "Suning global medical", values: [8, 14, 28, 48, 66] },
  { name: "Lido plastic surgery", values: [3, 6, 10, 15, 21] }, { name: "Li Meikang", values: [4, 6, 9, 12, 17] },
  { name: "Rongen group", values: [2, 3, 4, 5, 6] }, { name: "Langzir", values: [7, 11, 16, 17, 20] }, { name: "Yongcheng medical beauty", values: [4, 7, 10, 13, 16] }
];
const countries = Array.from({ length: 10 }, (_, index) => index + 1);
const projects = Array.from({ length: 7 }, (_, index) => String(index + 1).padStart(2, "0"));
const flowLinks = [
  { source: 0, target: 0, color: "#7488b8" }, { source: 0, target: 2, color: "#e3abb6" },
  { source: 1, target: 1, color: "#aab7d7" }, { source: 2, target: 2, color: "#dea2b0" },
  { source: 3, target: 3, color: "#7488b8" }, { source: 3, target: 4, color: "#e5bac3" },
  { source: 4, target: 4, color: "#aab7d7" }, { source: 5, target: 5, color: "#dea2b0" },
  { source: 6, target: 1, color: "#7488b8" }, { source: 6, target: 6, color: "#e3abb6" },
  { source: 7, target: 3, color: "#aab7d7" }, { source: 8, target: 5, color: "#dea2b0" },
  { source: 9, target: 6, color: "#7488b8" }
];

export default {
  name: "BeautyIndustryViz",
  props: { lang: { type: String, required: true } },
  data() { return { branches, prices, contributors, institutions, countries, projects, flowLinks, activeBranch: "top", activeContributor: 6, activeInstitution: 1, activePrice: null, activeBlock: null, hoveredDetail: null }; },
  methods: {
    polar(angle, radius) { const radians = angle * Math.PI / 180; return { x: 500 + Math.cos(radians) * radius, y: 460 + Math.sin(radians) * radius }; },
    branchPoint(branch, radius) { return this.polar(branch.angle, radius); },
    leafPoint(branch, index) { return this.polar(branch.angle + (index - 5.5) * 6, 222); },
    branchPath(branch, index) { const spread = (index - 5.5) * 6; const origin = this.branchPoint(branch, 126); const controlA = this.polar(branch.angle + spread * .12, 158); const controlB = this.polar(branch.angle + spread * .9, 195); const end = this.leafPoint(branch, index); return `M${origin.x} ${origin.y} C${controlA.x} ${controlA.y} ${controlB.x} ${controlB.y} ${end.x} ${end.y}`; },
    barTransform(index) { return `rotate(${index * (360 / this.prices.length)} 500 460)`; },
    barHeight(value, index) { return this.activePrice === null ? 39 + (index % 4) * 3 : 14 + value * 7; },
    flowPath(link) { const startX = this.sourceX(link.source); const endX = this.targetX(link.target); return `M${startX} 1126 C${startX} 1182, ${endX} 1228, ${endX} 1274`; },
    sourceX(index) { return 585 + index * 36; },
    targetX(index) { return 595 + index * 48; },
    stackColor(index) { return ["#758ab9", "#9aabca", "#c5ccdc", "#e7d5dc", "#e4a6b3"][index]; },
    stackWidth(value) { return value * 2.5; },
    showDetail(title, value, x = 66, y = 770) { const position = this.detailPosition(x, y); this.hoveredDetail = { title, value, ...position }; },
    clearDetail() { this.hoveredDetail = null; },
    showBlock(x, y, width, height, color, title, value) { this.activeBlock = { x, y, width, height, color }; this.showDetail(title, value, x + width + 14, y - 4); },
    clearBlock() { this.activeBlock = null; this.clearDetail(); },
    floatingX(block) { return block.x - block.width * .06; },
    floatingY(block) { return block.y - block.height * .06 - 8; },
    floatingWidth(block) { return block.width * 1.12; },
    floatingHeight(block) { return block.height * 1.12; },
    detailPosition(x, y) { return { x: Math.max(18, Math.min(760, x + 12)), y: Math.max(18, Math.min(1324, y + 12)) }; },
    followPointer(event) { if (!this.hoveredDetail) return; const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 1000; const y = (event.clientY - rect.top) / rect.height * 1400; const position = this.detailPosition(x, y); this.hoveredDetail = { ...this.hoveredDetail, ...position }; },
    barDetailX(index) { return this.polar(index * (360 / this.prices.length), 306).x; },
    barDetailY(index) { return this.polar(index * (360 / this.prices.length), 306).y; },
    branchForBar(index) { return ["top", "right", "bottom-right", "bottom-left", "left"][Math.floor(((index + 20) % this.prices.length) / 12)]; },
    barColor(index) { return branches.find((branch) => branch.id === this.branchForBar(index)).color; },
    branchStartIndex(branch) { return { top: 40, right: 52, "bottom-right": 4, "bottom-left": 16, left: 28 }[branch.id]; },
    barIndexForLeaf(branch, index) { return (this.branchStartIndex(branch) + index) % this.prices.length; },
    connectorStart(branch, index) { return this.leafPoint(branch, index); },
    connectorEnd(branch, index) { const barIndex = this.barIndexForLeaf(branch, index); return this.polar(barIndex * (360 / this.prices.length), 320 - this.barHeight(this.prices[barIndex], barIndex)); },
    showBranchDetail(branch) { const point = this.branchPoint(branch, 218); this.showDetail('项目分布', '12 个关联项目', point.x, point.y); },
    institutionStart(institution, index) { return 57 + institution.values.slice(0, index).reduce((sum, item) => sum + this.stackWidth(item), 0); },
    showFlowDetail(link) { this.showDetail('资源流向', '节点 ' + (link.source + 1) + ' → ' + this.projects[link.target], (this.sourceX(link.source) + this.targetX(link.target)) / 2, 1200); }
  },
  template: `
    <section class="beauty-replica" aria-label="Beauty industry information visualisation replica">
      <svg class="beauty-replica__canvas" viewBox="0 0 1000 1400" role="img" :aria-label="lang === 'zh' ? '美容行业信息可视化海报' : 'Beauty industry information visualisation poster'" @mousemove="followPointer">
        <defs><clipPath id="beauty-face-crop"><circle cx="500" cy="460" r="72" /></clipPath></defs>
        <text x="75" y="50" class="beauty-replica__title">▪ 常见医美项目</text><text x="282" y="72" class="beauty-replica__title">与价格分布　▪</text>
        <g class="beauty-replica__legend"><circle cx="845" cy="105" r="71" class="pink"/><circle cx="845" cy="105" r="55" class="blue"/><circle cx="845" cy="105" r="40" class="mint"/><circle cx="845" cy="105" r="25" class="sand"/><text x="845" y="111">500</text><text x="834" y="140">2500</text><text x="839" y="156">5000</text><text x="880" y="169">12500</text></g>
        <g class="beauty-replica__outer-prices"><g v-for="(value, index) in prices" :key="index" :transform="barTransform(index)"><g class="beauty-replica__bar-item" :class="{ 'is-active': activePrice === index }" @mouseenter="activePrice = index; activeBranch = branchForBar(index); showDetail('价格区间', '￥' + value + ' 万', barDetailX(index), barDetailY(index))" @mouseleave="activePrice = null; clearDetail"><rect x="496" y="140" width="7" :height="barHeight(value, index)" rx="3.5" :fill="barColor(index)"/></g></g></g>
        <circle cx="500" cy="460" r="280" class="beauty-replica__ring pink"/><circle cx="500" cy="460" r="250" class="beauty-replica__ring blue"/><circle cx="500" cy="460" r="220" class="beauty-replica__ring mint"/><circle cx="500" cy="460" r="190" class="beauty-replica__ring sand"/>
        <g v-for="branch in branches" :key="branch.id" class="beauty-replica__branch" :class="{ 'is-active': activeBranch === branch.id }" @mouseenter="activeBranch = branch.id; showBranchDetail(branch)" @mouseleave="clearDetail"><path v-for="index in 12" :key="index" :d="branchPath(branch, index - 1)" :stroke="branch.color"/><line v-for="index in 12" :key="'connector-' + index" class="beauty-replica__branch-connector" :x1="connectorStart(branch, index - 1).x" :y1="connectorStart(branch, index - 1).y" :x2="connectorEnd(branch, index - 1).x" :y2="connectorEnd(branch, index - 1).y" :stroke="branch.color"/><circle :cx="branchPoint(branch, 126).x" :cy="branchPoint(branch, 126).y" r="5" :fill="branch.color"/></g>
        <g class="beauty-replica__face-rings"><circle cx="500" cy="460" r="104" class="pink-arc"/><circle cx="500" cy="460" r="92" class="blue-arc"/><circle cx="500" cy="460" r="82" class="ring-cover"/><image href="/images/study/信息可视化/portrait-source.png" x="428" y="378" width="144" height="170" clip-path="url(#beauty-face-crop)" preserveAspectRatio="xMidYMid slice"/><circle cx="500" cy="460" r="72" class="face-outline"/><g class="beauty-replica__face-point face-point--nose" @mouseenter="showDetail('鼻子', '鼻梁 / 鼻尖塑形', 477, 440)" @mouseleave="clearDetail"><circle cx="477" cy="440" r="8"/><circle cx="477" cy="440" r="3.5"/></g><g class="beauty-replica__face-point face-point--mouth" @mouseenter="showDetail('嘴巴', '唇部轮廓改善', 462, 466)" @mouseleave="clearDetail"><circle cx="462" cy="466" r="8"/><circle cx="462" cy="466" r="3.5"/></g><g class="beauty-replica__face-point face-point--face-shape" @mouseenter="showDetail('脸型', '外轮廓塑形', 524, 455)" @mouseleave="clearDetail"><circle cx="524" cy="455" r="10"/><circle cx="524" cy="455" r="4"/></g><g class="beauty-replica__face-point face-point--face" @mouseenter="showDetail('脸部', '面中部填充', 505, 452)" @mouseleave="clearDetail"><circle cx="505" cy="452" r="11"/><circle cx="505" cy="452" r="5"/><circle cx="505" cy="452" r="2"/></g><g class="beauty-replica__face-point face-point--jaw" @mouseenter="showDetail('下颌骨', '下颌线改善', 510, 486)" @mouseleave="clearDetail"><circle cx="510" cy="486" r="9"/><circle cx="510" cy="486" r="3.5"/></g></g>
        <g class="beauty-replica__contributor"><text x="110" y="875" class="beauty-replica__small-heading">女性外貌影响因素</text><path d="M110 890 H294" class="grid"/><g v-for="(value, index) in contributors" :key="value" class="beauty-replica__contributor-item" @mouseenter="activeContributor = index; showDetail('外貌影响指数', value + ' / 100', 110 + index * 17, 900 + value)" @mouseleave="clearDetail"><rect :x="110 + index * 17" :y="900" width="13" :height="value" :fill="index <= activeContributor ? '#e5a4b1' : '#d8dce5'"/><circle :cx="116 + index * 17" :cy="900 + value" r="3" fill="#d96f91"/></g><path :d="contributors.map((value, index) => (index ? 'L' : 'M') + (116 + index * 17) + ' ' + (900 + value)).join(' ')" class="contributor-line"/></g>
        <text x="778" y="830" class="beauty-replica__small-heading">▪ 医美手术动机</text><g class="beauty-replica__treemap"><g class="beauty-replica__block" @mouseenter="showBlock(792, 850, 90, 92, '#7488b8', '医美动机', '追求外观 · 44%')" @mouseleave="clearBlock"><rect x="792" y="850" width="90" height="92" fill="#7488b8"/></g><g class="beauty-replica__block" @mouseenter="showBlock(882, 850, 52, 46, '#cdd3e1', '医美动机', '提升自信 · 18%')" @mouseleave="clearBlock"><rect x="882" y="850" width="52" height="46" fill="#cdd3e1"/></g><g class="beauty-replica__block" @mouseenter="showBlock(882, 896, 52, 46, '#b9c4dc', '医美动机', '改善状态 · 15%')" @mouseleave="clearBlock"><rect x="882" y="896" width="52" height="46" fill="#b9c4dc"/></g><g class="beauty-replica__block" @mouseenter="showBlock(792, 942, 90, 48, '#dce0e7', '医美动机', '社交吸引 · 14%')" @mouseleave="clearBlock"><rect x="792" y="942" width="90" height="48" fill="#dce0e7"/></g><g class="beauty-replica__block" @mouseenter="showBlock(882, 942, 52, 25, '#ead7dd', '医美动机', '改善状态 · 9%')" @mouseleave="clearBlock"><rect x="882" y="942" width="52" height="25" fill="#ead7dd"/></g><g class="beauty-replica__block" @mouseenter="showBlock(882, 967, 28, 23, '#e8acb8', '医美动机', '其他 · 6%')" @mouseleave="clearBlock"><rect x="882" y="967" width="28" height="23" fill="#e8acb8"/></g><g v-if="activeBlock" class="beauty-replica__treemap-float"><rect :x="floatingX(activeBlock)" :y="floatingY(activeBlock)" :width="floatingWidth(activeBlock)" :height="floatingHeight(activeBlock)" rx="6" :fill="activeBlock.color"/></g></g>
        <g class="beauty-replica__institutions"><text x="300" y="1198" class="beauty-replica__year">2013　~　2021</text><text x="280" y="1390" class="beauty-replica__small-heading">医美机构营业额</text><g v-for="(institution, row) in institutions" :key="institution.name"><text x="50" :y="1220 + row * 25" text-anchor="end" class="institution-name">{{ institution.name }}</text><g v-for="(value, index) in institution.values" :key="index" class="beauty-replica__institution-item" @mouseenter="activeInstitution = row; showDetail(institution.name, '营业额指数：' + value, institutionStart(institution, index), 1209 + row * 25)" @mouseleave="clearDetail"><rect :x="institutionStart(institution, index)" :y="1209 + row * 25" :width="stackWidth(value)" height="16" :fill="stackColor(index)"/></g></g></g>
        <g class="beauty-replica__flows"><text x="590" y="1092" class="beauty-replica__small-heading">国际医美资源分布</text><g class="flow-lines"><path v-for="(link, index) in flowLinks" :key="index" :d="flowPath(link)" :stroke="link.color" @mouseenter="showFlowDetail(link)" @mouseleave="clearDetail"/></g><g v-for="(country, index) in countries" :key="country" class="flow-source"><circle :cx="sourceX(index)" cy="1120" r="4" :fill="index % 2 ? '#d99baa' : '#788dbd'"/><line :x1="sourceX(index)" y1="1126" :x2="sourceX(index)" y2="1140"/><text :x="sourceX(index)" y="1105" text-anchor="middle">{{ country }}</text></g><g v-for="(project, index) in projects" :key="project" class="flow-target"><line :x1="targetX(index)" y1="1258" :x2="targetX(index)" y2="1274"/><rect :x="targetX(index) - 7" y="1274" width="14" height="18" rx="3" :fill="index % 2 ? '#e3abb6' : '#8d9fca'"/><text :x="targetX(index)" y="1307" text-anchor="middle">{{ project }}</text></g><text x="670" y="1345" class="beauty-replica__small-heading">各地区热门医美项目</text></g>
        <g v-if="hoveredDetail" class="beauty-replica__detail-card" :transform="'translate(' + hoveredDetail.x + ' ' + hoveredDetail.y + ')' "><foreignObject x="0" y="0" width="220" height="52"><div xmlns="http://www.w3.org/1999/xhtml" class="beauty-replica__detail-glass"></div></foreignObject><text x="16" y="22">{{ hoveredDetail.title }}</text><text x="16" y="41">{{ hoveredDetail.value }}</text></g>
      </svg>
    </section>
  `
};
