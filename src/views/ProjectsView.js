import { content, projects } from "../data/content.js";
import { normalizeProjectKind, projectDetailHref } from "../utils/projectNavigation.js";

export default {
  name: "ProjectsView",
  props: {
    lang: {
      type: String,
      required: true
    },
    kind: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      filterIndicator: {
        ready: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    };
  },
  computed: {
    activeKind() {
      return normalizeProjectKind(this.kind);
    },
    filters() {
      return content.projectFilters[this.lang];
    },
    projects() {
      if (this.activeKind === "all") return projects;
      return projects.filter((project) => project.discipline === this.activeKind);
    },
    filterIndicatorStyle() {
      return {
        "--filter-indicator-x": `${this.filterIndicator.x}px`,
        "--filter-indicator-y": `${this.filterIndicator.y}px`,
        "--filter-indicator-width": `${this.filterIndicator.width}px`,
        "--filter-indicator-height": `${this.filterIndicator.height}px`
      };
    }
  },
  watch: {
    activeKind() {
      this.updateFilterIndicator();
    },
    lang() {
      this.updateFilterIndicator();
    }
  },
  mounted() {
    this.updateFilterIndicator();
    window.addEventListener("resize", this.updateFilterIndicator);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateFilterIndicator);
  },
  methods: {
    updateFilterIndicator() {
      this.$nextTick(() => {
        const activeButton = this.$el.querySelector(".filter-button.active");
        if (!activeButton) return;

        this.filterIndicator = {
          ready: true,
          x: activeButton.offsetLeft,
          y: activeButton.offsetTop,
          width: activeButton.offsetWidth,
          height: activeButton.offsetHeight
        };
      });
    },
    projectHref(project) {
      return project.closed ? null : projectDetailHref(this.lang, project.slug, this.activeKind);
    }
  },
  template: `
    <section class="project-browser" aria-label="Projects">
      <div
        class="project-filterbar"
        :class="{ 'project-filterbar--ready': filterIndicator.ready }"
        :style="filterIndicatorStyle"
        aria-label="Project categories"
      >
        <span class="project-filterbar__indicator" aria-hidden="true"></span>
        <a
          v-for="filter in filters"
          :key="filter.key"
          class="filter-button"
          :class="['filter-button--' + filter.key, { active: activeKind === filter.key }]"
          :href="'#/' + lang + '/projects/' + filter.key"
        >{{ filter.label }}</a>
      </div>

      <div class="project-grid">
        <article
          v-for="project in projects"
          :key="project.slug"
          class="project-card"
          :class="{ 'project-card--closed': project.closed }"
        >
          <a v-if="projectHref(project)" :href="projectHref(project)" class="project-card__link">
            <img class="project-card__image" :src="project.image" :alt="project.title[lang]" />
            <span class="project-card__title">{{ project.title[lang] }}</span>
            <span v-if="project.tags?.length" class="project-tags" aria-label="项目标签">
              <span v-for="tag in project.tags" :key="tag.key" class="project-tag">{{ tag[lang] }}</span>
            </span>
          </a>
          <div v-else class="project-card__link">
            <img class="project-card__image" :src="project.image" :alt="project.title[lang]" />
            <span class="project-card__title">{{ project.title[lang] }}</span>
          </div>
        </article>
      </div>

      <p v-if="!projects.length" class="project-empty">
        {{ lang === 'zh' ? '即将更新' : 'Coming soon' }}
      </p>
    </section>
  `
};
