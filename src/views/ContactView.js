import { content } from "../data/content.js";

export default {
  name: "ContactView",
  data() {
    return {
      boardPieces: [
        { asset: "vector.svg", x: 8, y: 9, size: 15, rotate: -14 },
        { asset: "vector-1.svg", x: 29, y: 6, size: 17, rotate: 8 },
        { asset: "vector-2.svg", x: 53, y: 8, size: 14, rotate: -7 },
        { asset: "vector-3.svg", x: 77, y: 7, size: 13, rotate: 12 },
        { asset: "vector4.svg", x: 15, y: 34, size: 20, rotate: 7 },
        { asset: "vector5.svg", x: 42, y: 27, size: 16, rotate: -13 },
        { asset: "vector.svg", x: 69, y: 29, size: 12, rotate: 16 },
        { asset: "vector-2.svg", x: 85, y: 34, size: 11, rotate: -18 },
        { asset: "vector-3.svg", x: 5, y: 57, size: 12, rotate: -8 },
        { asset: "vector-1.svg", x: 25, y: 54, size: 15, rotate: 14 },
        { asset: "vector4.svg", x: 51, y: 57, size: 18, rotate: -5 },
        { asset: "vector5.svg", x: 73, y: 53, size: 14, rotate: 9 },
        { asset: "vector-2.svg", x: 10, y: 78, size: 12, rotate: 17 },
        { asset: "vector.svg", x: 33, y: 76, size: 13, rotate: -11 },
        { asset: "vector-3.svg", x: 56, y: 78, size: 11, rotate: 6 },
        { asset: "vector-1.svg", x: 78, y: 75, size: 14, rotate: -15 }
      ].map((piece) => ({ ...piece, dragLeft: null, dragTop: null })),
      dragState: null
    };
  },
  computed: {
    contact() {
      return content.contact;
    },
    boardLabel() {
      return "A collection of design marks";
    }
  },
  beforeUnmount() {
    this.removeDragListeners();
  },
  methods: {
    pieceStyle(piece, index) {
      const assetUrl = `/images/contact-board/${piece.asset}`;
      const palettes = [
        ["#8c6428", "#dfba65"],
        ["#334a61", "#8ba6b5"],
        ["#8d4a38", "#d48b67"],
        ["#4e5e49", "#9eae7b"],
        ["#62485c", "#b18498"]
      ];
      const origins = [[32, 68], [72, 38], [38, 28], [64, 72], [48, 52]];
      const palette = palettes[index % palettes.length];
      const origin = origins[index % origins.length];
      return {
        "--piece-x": piece.dragLeft === null ? `${piece.x}%` : `${piece.dragLeft}px`,
        "--piece-y": piece.dragTop === null ? `${piece.y}%` : `${piece.dragTop}px`,
        "--piece-size": `${piece.size}%`,
        "--piece-rotate": `${piece.rotate}deg`,
        "--piece-mask": `url("${assetUrl}")`,
        "--piece-ink-dark": palette[0],
        "--piece-ink-light": palette[1],
        "--piece-ink-x": `${origin[0]}%`,
        "--piece-ink-y": `${origin[1]}%`
      };
    },
    canDragPieces() {
      return (
        typeof window !== "undefined" &&
        window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 781px)").matches
      );
    },
    startPieceDrag(event, piece, index) {
      if (!this.canDragPieces() || event.button !== 0 || !this.$refs.board) {
        return;
      }

      const pieceRect = event.currentTarget.getBoundingClientRect();
      const boardRect = this.$refs.board.getBoundingClientRect();

      this.dragState = {
        index,
        piece,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: pieceRect.left + pieceRect.width / 2 - boardRect.left,
        originTop: pieceRect.top + pieceRect.height / 2 - boardRect.top
      };

      window.addEventListener("mousemove", this.movePiece);
      window.addEventListener("mouseup", this.finishPieceDrag, { once: true });
      event.preventDefault();
    },
    movePiece(event) {
      if (!this.dragState || !this.$refs.board) {
        return;
      }

      const boardRect = this.$refs.board.getBoundingClientRect();
      const nextViewportX = boardRect.left + this.dragState.originLeft + event.clientX - this.dragState.startX;
      const nextViewportY = boardRect.top + this.dragState.originTop + event.clientY - this.dragState.startY;

      this.dragState.piece.dragLeft = Math.max(0, Math.min(window.innerWidth, nextViewportX)) - boardRect.left;
      this.dragState.piece.dragTop = Math.max(0, Math.min(window.innerHeight, nextViewportY)) - boardRect.top;
      event.preventDefault();
    },
    finishPieceDrag() {
      this.removeDragListeners();
      this.dragState = null;
    },
    removeDragListeners() {
      if (typeof window === "undefined") {
        return;
      }
      window.removeEventListener("mousemove", this.movePiece);
      window.removeEventListener("mouseup", this.finishPieceDrag);
    }
  },
  template: `
    <section class="contact-page">
      <figure ref="board" class="contact-board" :aria-label="boardLabel">
        <button
          v-for="(piece, index) in boardPieces"
          :key="index"
          class="contact-board__piece"
          :class="{ 'contact-board__piece--dragging': dragState && dragState.index === index }"
          type="button"
          :style="pieceStyle(piece, index)"
          :aria-label="'Design mark ' + (index + 1)"
          @mousedown="startPieceDrag($event, piece, index)"
        >
          <span class="contact-board__silhouette" aria-hidden="true"></span>
          <span class="contact-board__gold" aria-hidden="true"></span>
        </button>
      </figure>
      <div class="contact-list">
        <p v-for="item in contact.items" :key="item.label">
          <strong>{{ item.label }}</strong>
          <span>{{ item.value }}</span>
        </p>
      </div>
    </section>
  `
};
