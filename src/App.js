import { computed, onMounted, onUnmounted, reactive } from "/vendor/vue.esm-browser.prod.js";
import { content, findProject } from "./data/content.js";
import SiteHeader from "./components/SiteHeader.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import ContactView from "./views/ContactView.js";
import ProjectsView from "./views/ProjectsView.js";
import ProjectDetailView from "./views/ProjectDetailView.js";

function getHashPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

const projectKinds = ["visual", "ui", "product", "others", "unpublished", "vibe-coding", "all"];

export default {
  name: "App",
  components: {
    SiteHeader,
    HomeView,
    AboutView,
    ContactView,
    ProjectsView,
    ProjectDetailView
  },
  setup() {
    const route = reactive({ path: getHashPath() });
    const updateRoute = () => {
      route.path = getHashPath();
    };
    const scrollPageTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    onMounted(() => window.addEventListener("hashchange", updateRoute));
    onUnmounted(() => window.removeEventListener("hashchange", updateRoute));

    const parts = computed(() => route.path.split("/").filter(Boolean));
    const lang = computed(() => (["en", "zh"].includes(parts.value[0]) ? parts.value[0] : null));
    const page = computed(() => parts.value[1] || "home");
    const kind = computed(() => {
      const value = parts.value[2] || "all";
      return projectKinds.includes(value) ? value : "all";
    });
    const slug = computed(() => parts.value[2] || "");
    const project = computed(() => findProject(slug.value));
    const activeSection = computed(() => {
      if (page.value === "projects" || page.value === "project") return "artwork";
      return page.value;
    });
    const returnKind = computed(() => project.value?.discipline || kind.value || "all");
    const viewKey = computed(() => route.path);

    return {
      content,
      route,
      lang,
      page,
      kind,
      project,
      activeSection,
      returnKind,
      viewKey,
      scrollPageTop
    };
  },
  template: `
    <Transition name="site-shell" mode="out-in" appear @before-enter="scrollPageTop">
      <HomeView v-if="!lang" key="language-home" />
      <div v-else class="site-shell" :key="'site-' + lang">
        <SiteHeader
          :lang="lang"
          :active-section="activeSection"
          :return-kind="returnKind"
          :compact="page === 'project'"
        />
        <main class="site-content">
          <Transition
            name="page-view"
            mode="out-in"
            appear
            :duration="{ enter: 900, leave: 220 }"
            @before-enter="scrollPageTop"
          >
            <AboutView v-if="page === 'about'" :key="viewKey" :lang="lang" />
            <ContactView v-else-if="page === 'contact'" :key="viewKey" :lang="lang" />
            <ProjectDetailView
              v-else-if="page === 'project'"
              :key="viewKey"
              :lang="lang"
              :project="project"
            />
            <ProjectsView
              v-else
              :key="'projects-' + lang"
              :lang="lang"
              :kind="kind"
            />
          </Transition>
        </main>
      </div>
    </Transition>
  `
};
