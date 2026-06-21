import { content } from "../data/content.js";

export default {
  name: "SiteHeader",
  props: {
    lang: {
      type: String,
      required: true
    },
    activeSection: {
      type: String,
      default: "school"
    },
    returnKind: {
      type: String,
      default: "all"
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    labels() {
      return content.nav[this.lang];
    }
  },
  template: `
    <header class="site-header" :class="{ 'site-header--compact': compact }">
      <a class="phone-logo" :href="'#/' + lang + '/projects/school'" aria-label="Portfolio home">
        <img src="/images/yang.svg" alt="MY logo mark" />
      </a>
      <a class="logo-mark" :href="'#/' + lang + '/projects/school'" aria-label="Portfolio home">
        <span>CHEN MUYANG</span>
      </a>

      <nav v-if="!compact" class="top-nav" aria-label="Main navigation">
        <a
          class="nav-link"
          :class="{ active: activeSection === 'about' }"
          :href="'#/' + lang + '/about'"
        >{{ labels.about }}</a>
        <span class="nav-separator">|</span>
        <a
          class="nav-link"
          :class="{ active: activeSection === 'artwork' }"
          :href="'#/' + lang + '/projects/all'"
        >{{ labels.artwork }}</a>
        <span class="nav-separator">|</span>
        <a
          class="nav-link"
          :class="{ active: activeSection === 'contact' }"
          :href="'#/' + lang + '/contact'"
        >{{ labels.contact }}</a>
      </nav>

      <a v-else class="return-button" :href="'#/' + lang + '/projects/' + returnKind">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        <span>{{ lang === 'zh' ? '返回' : 'Back' }}</span>
      </a>
    </header>
  `
};
