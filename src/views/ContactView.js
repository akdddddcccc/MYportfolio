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
      ]
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
  methods: {
    pieceStyle(piece) {
      const assetUrl = `/images/contact-board/${piece.asset}`;
      return {
        "--piece-x": `${piece.x}%`,
        "--piece-y": `${piece.y}%`,
        "--piece-size": `${piece.size}%`,
        "--piece-rotate": `${piece.rotate}deg`,
        "--piece-mask": `url("${assetUrl}")`
      };
    }
  },
  template: `
    <section class="contact-page">
      <figure class="contact-board" :aria-label="boardLabel">
        <button
          v-for="(piece, index) in boardPieces"
          :key="index"
          class="contact-board__piece"
          type="button"
          :style="pieceStyle(piece)"
          :aria-label="'Design mark ' + (index + 1)"
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
