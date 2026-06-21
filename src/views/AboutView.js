import { content } from "../data/content.js";

export default {
  name: "AboutView",
  props: {
    lang: {
      type: String,
      required: true
    }
  },
  computed: {
    about() {
      return content.about[this.lang];
    },
    image() {
      return content.about.image;
    }
  },
  template: `
    <section class="about-page">
      <div class="about-left">
        <img class="portrait" :src="image" alt="Chen Muyang portrait" />
        <div class="identity">
          <h1>{{ about.name }}</h1>
          <p>{{ about.romanName }}</p>
          <span>{{ about.sentence }}</span>
        </div>
      </div>
      <div class="about-right">
        <section v-for="section in about.sections" :key="section.title" class="about-section">
          <h2>{{ section.title }}</h2>
          <p>{{ section.body }}</p>
        </section>
      </div>
    </section>
  `
};
