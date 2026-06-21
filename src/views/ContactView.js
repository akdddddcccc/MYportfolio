import { content } from "../data/content.js";

export default {
  name: "ContactView",
  data() {
    return {
      spotlightX: 50,
      spotlightY: 50,
      spotlightActive: false
    };
  },
  computed: {
    contact() {
      return content.contact;
    },
    spotlightStyle() {
      return {
        "--spotlight-x": `${this.spotlightX}%`,
        "--spotlight-y": `${this.spotlightY}%`
      };
    }
  },
  methods: {
    canUseSpotlight() {
      return (
        typeof window !== "undefined" &&
        window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 781px)").matches
      );
    },
    updateSpotlight(event) {
      if (!this.canUseSpotlight() || !this.$refs.portrait) {
        return;
      }

      const rect = this.$refs.portrait.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      this.spotlightX = Math.max(-24, Math.min(124, x));
      this.spotlightY = Math.max(-24, Math.min(124, y));
      this.spotlightActive = true;
    },
    activateSpotlight(event) {
      if (!this.canUseSpotlight()) {
        return;
      }

      this.spotlightActive = true;
      this.updateSpotlight(event);
    },
    deactivateSpotlight() {
      this.spotlightActive = false;
    }
  },
  template: `
    <section
      class="contact-page"
      @pointerenter="activateSpotlight"
      @pointermove="updateSpotlight"
      @pointerleave="deactivateSpotlight"
    >
      <figure
        ref="portrait"
        class="contact-portrait"
        :class="{ 'contact-portrait--active': spotlightActive }"
        :style="spotlightStyle"
      >
        <img class="contact-image contact-image--dim" :src="contact.image" alt="Concept portrait" />
        <img class="contact-image contact-image--lit" :src="contact.image" alt="" aria-hidden="true" />
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
