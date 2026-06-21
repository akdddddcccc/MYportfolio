import { content } from "../data/content.js";

export default {
  name: "HomeView",
  setup() {
    return { home: content.home };
  },
  template: `
    <main class="language-home">
      <div class="home-logo">
        <img :src="home.logo" alt="MY portfolio" />
      </div>
      <section class="language-panels" aria-label="Language selection">
        <a class="language-panel language-panel--dark" :href="home.en.href">
          <span class="language-label">{{ home.en.label }}</span>
          <span class="language-line">{{ home.en.line }}</span>
        </a>
        <a class="language-panel language-panel--light" :href="home.zh.href">
          <span class="language-label">{{ home.zh.label }}</span>
          <span class="language-line">{{ home.zh.line }}</span>
        </a>
      </section>
    </main>
  `
};
