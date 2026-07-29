import "../styles/guandan-table-demo.css";
import "../styles/guandan-table-demo-layout.css";
import "../styles/guandan-table-demo-motion.css";
import "../styles/guandan-table-demo-interactions.css";

const HAND = [
  ["heart", "black-heart-7.svg", "红桃 7"], ["club", "white-club-7.svg", "梅花 7"], ["spade", "white-spade-10.svg", "黑桃 10"], ["diamond", "black-diamond-5.svg", "方块 5"], ["heart-4", "black-heart-4.svg", "红桃 4"], ["heart-9", "black-heart-9.svg", "红桃 9"], ["club-3", "white-club-3.svg", "梅花 3"], ["club-10", "white-club-10.svg", "梅花 10"], ["spade-5", "white-spade-5.svg", "黑桃 5"], ["diamond-8", "black-diamond-8.svg", "方块 8"], ["joker", "joker-117.svg", "大王"]
].map(([id, file, zh]) => ({ id, src: `/images/work/guandan-demo/${file}`, zh }));

const PILE = [
  { src: "/images/work/guandan-demo/card-back.svg", x: 18, y: 24, rotate: -16 }, { src: "/images/work/guandan-demo/white-club-7.svg", x: 43, y: 10, rotate: 9 }, { src: "/images/work/guandan-demo/black-heart-4.svg", x: 92, y: 35, rotate: -7 }, { src: "/images/work/guandan-demo/white-spade-10.svg", x: 65, y: 88, rotate: 17 }, { src: "/images/work/guandan-demo/card-back.svg", x: 127, y: 106, rotate: -12 }, { src: "/images/work/guandan-demo/black-diamond-8.svg", x: 145, y: 54, rotate: 13 }, { src: "/images/work/guandan-demo/white-club-3.svg", x: 5, y: 112, rotate: -5 }, { src: "/images/work/guandan-demo/card-back.svg", x: 104, y: 2, rotate: 21 }, { src: "/images/work/guandan-demo/black-heart-9.svg", x: 175, y: 128, rotate: 8 }, { src: "/images/work/guandan-demo/white-spade-5.svg", x: 188, y: 18, rotate: -19 }
];

const CARD_RANK = { "club-3": 3, "heart-4": 4, diamond: 5, "spade-5": 5, heart: 7, club: 7, "diamond-8": 8, "heart-9": 9, spade: 10, "club-10": 10, joker: 18 };

export default {
  name: "GuandanTableDemo",
  props: { lang: { type: String, required: true } },
  data() { return { hand: HAND, pileCards: PILE, selectedCardId: "heart", selectedPileIndex: 4, playedCard: null, dealing: false, draggingPileIndex: -1, pileOffset: { x: 0, y: 0 }, pileDragStart: { x: 0, y: 0 }, markerPositions: { dark: { x: 38.3, y: 38 }, light: { x: 61.8, y: 61.8 } }, draggingMarker: "" }; },
  computed: {
    copy() { return this.lang === "zh" ? { eyebrow: "Interactive table", title: "一局正在进行的掼蛋", lead: "四人对家结队、两副牌各 27 张。点选手牌置顶，拖动棋子记录当前进度。", you: "白方 · 我", partner: "白方 · 对家", blackOne: "黑方 · 上家", blackTwo: "黑方 · 下家", score: "积分板", scoreHint: "直接拖动黑白棋子", choose: "选择手牌", play: "出牌", replay: "重新发牌", dark: "黑棋", light: "白棋", empty: "等待出牌", played: "本轮落牌" } : { eyebrow: "Interactive table", title: "A Guandan hand in progress", lead: "Four players form two partnerships, with 27 cards per player. Select a card to bring it forward, or drag a marker to track progress.", you: "White team · you", partner: "White team · partner", blackOne: "Black team · upper", blackTwo: "Black team · lower", score: "Score board", scoreHint: "Drag either marker", choose: "Choose a card", play: "Play card", replay: "Deal again", dark: "Black marker", light: "White marker", empty: "Waiting for play", played: "Card in play" }; },
    selectedCard() { return this.hand.find((card) => card.id === this.selectedCardId) || this.hand[0]; },
    orderedHand() { return [...this.hand].sort((a, b) => (CARD_RANK[a.id] || 99) - (CARD_RANK[b.id] || 99) || a.id.localeCompare(b.id)); }
  },
  methods: {
    selectCard(id) { this.selectedCardId = id; },
    playCard() { this.playedCard = this.selectedCard; const remaining = this.hand.filter((card) => card.id !== this.selectedCardId); this.hand = remaining; this.selectedCardId = remaining[0]?.id || ""; },
    resetHand() { if (this.dealing) return; this.dealing = true; this.playedCard = null; setTimeout(() => { this.hand = HAND; this.selectedCardId = HAND[0].id; }, 380); setTimeout(() => { this.dealing = false; }, 1150); },
    selectPile(index) { this.selectedPileIndex = index; },
    startPileDrag(event, index) { event.preventDefault(); this.draggingPileIndex = index; this.pileDragStart = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture?.(event.pointerId); },
    movePileCard(event) { if (this.draggingPileIndex < 0) return; this.pileOffset = { x: Math.max(-22, Math.min(22, event.clientX - this.pileDragStart.x)), y: Math.max(-18, Math.min(18, event.clientY - this.pileDragStart.y)) }; },
    endPileDrag() { this.draggingPileIndex = -1; this.pileOffset = { x: 0, y: 0 }; },
    pileStyle(card, index) { const active = this.selectedPileIndex === index; const dragging = this.draggingPileIndex === index; const x = dragging ? this.pileOffset.x : 0; const y = (dragging ? this.pileOffset.y : 0) + (active ? -14 : 0); return { left: `${card.x}px`, top: `${card.y}px`, zIndex: active ? 12 : index + 1, transform: `translate(${x}px, ${y}px) rotate(${card.rotate}deg)` }; },
    updateMarker(event, tone) { const rect = event.currentTarget.getBoundingClientRect(); this.markerPositions[tone] = { x: Math.max(6, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(6, Math.min(94, ((event.clientY - rect.top) / rect.height) * 100)) }; },
    startMarkerDrag(event, tone) { this.draggingMarker = tone; event.currentTarget.setPointerCapture?.(event.pointerId); },
    moveMarker(event) { if (this.draggingMarker) this.updateMarker(event, this.draggingMarker); },
    endMarkerDrag() { this.draggingMarker = ""; }
  },
  template: `
    <section class="guandan-demo" :aria-label="copy.title">
      <header class="guandan-demo__intro"><div><p class="guandan-demo__eyebrow">{{ copy.eyebrow }}</p><h2>{{ copy.title }}</h2><p>{{ copy.lead }}</p></div></header>
      <div class="guandan-game" :class="{ dealing: dealing }">
        <div class="guandan-game__seat guandan-game__seat--top"><span>{{ copy.blackOne }}</span><div class="guandan-game__opponent-hand"><img v-for="index in 12" :key="index" :style="{ '--deal-order': index }" src="/images/work/guandan-demo/card-back.svg" alt="" /></div></div>
        <div class="guandan-game__seat guandan-game__seat--left"><span>{{ copy.partner }}</span><div class="guandan-game__side-hand"><img v-for="index in 9" :key="index" :style="{ '--deal-order': index }" src="/images/work/guandan-demo/card-back.svg" alt="" /></div></div>
        <div class="guandan-game__seat guandan-game__seat--right"><span>{{ copy.blackTwo }}</span><div class="guandan-game__side-hand"><img v-for="index in 9" :key="index" :style="{ '--deal-order': index }" src="/images/work/guandan-demo/card-back.svg" alt="" /></div></div>
        <section class="guandan-game__score" :aria-label="copy.score"><div class="guandan-game__score-canvas" @pointermove="moveMarker" @pointerup="endMarkerDrag" @pointercancel="endMarkerDrag"><img src="/images/work/guandan-demo/scoreboard.svg" :alt="copy.score" /><button type="button" class="guandan-game__marker guandan-game__marker--dark" :style="{ left: markerPositions.dark.x + '%', top: markerPositions.dark.y + '%' }" @pointerdown.stop="startMarkerDrag($event, 'dark')" :aria-label="copy.dark"></button><button type="button" class="guandan-game__marker guandan-game__marker--light" :style="{ left: markerPositions.light.x + '%', top: markerPositions.light.y + '%' }" @pointerdown.stop="startMarkerDrag($event, 'light')" :aria-label="copy.light"></button></div></section>
        <section class="guandan-game__trick guandan-game__trick--pile" :aria-label="copy.played"><p>{{ playedCard ? copy.played : copy.empty }}</p><button v-for="(card, index) in pileCards" :key="index" type="button" class="guandan-game__pile-card" :class="{ active: selectedPileIndex === index, dragging: draggingPileIndex === index }" :style="pileStyle(card, index)" @pointerdown="startPileDrag($event, index)" @pointermove="movePileCard" @pointerup="endPileDrag" @pointercancel="endPileDrag" @click="selectPile(index)"><img :src="card.src" alt="" draggable="false" /></button><img v-if="playedCard" class="guandan-game__pile-card guandan-game__pile-card--played" :src="playedCard.src" :alt="playedCard.zh" /></section>
        <section class="guandan-game__seat guandan-game__seat--bottom" :aria-label="copy.you"><div class="guandan-game__you-label"><span>{{ copy.you }}</span><button type="button" @click="resetHand">{{ copy.replay }}</button></div><div class="guandan-game__hand"><button v-for="card in orderedHand" :key="card.id" type="button" :class="{ active: selectedCardId === card.id }" @click="selectCard(card.id)" :aria-label="card.zh"><img :src="card.src" :alt="card.zh" /></button></div><div class="guandan-game__action"><p>{{ hand.length ? copy.choose + '：' + selectedCard.zh : copy.empty }}</p><button type="button" :disabled="!hand.length" @click="playCard">{{ copy.play }}</button></div></section>
      </div>
    </section>
  `
};
