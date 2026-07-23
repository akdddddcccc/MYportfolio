import TaskMapDemo from "../components/TaskMapDemo.js";
import AIWorkflowDemo from "../components/AIWorkflowDemo.js";
import BeautyIndustryViz from "../components/BeautyIndustryViz.js";
import SenseOfTimeDemo from "../components/SenseOfTimeDemo.js";

export default {
  name: "ProjectDetailView",
  components: {
    TaskMapDemo,
    AIWorkflowDemo,
    BeautyIndustryViz,
    SenseOfTimeDemo
  },
  props: {
    lang: {
      type: String,
      required: true
    },
    project: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loadedCodeBlocks: [],
      loadedEmbeds: {},
      loadingTimer: null,
      loadingWordIndex: 0,
      lightboxImage: "",
      flowExperienceOpen: false,
      bodyOverflowBeforeFlow: "",
      htmlOverflowBeforeFlow: "",
      htmlScrollbarGutterBeforeFlow: "",
      flowInlineFrameMode: "portrait",
      flowOverlayFrameMode: "portrait",
      codeExpanded: {}
    };
  },
  mounted() {
    this.loadingTimer = window.setInterval(() => {
      this.loadingWordIndex += 1;
    }, 1100);
    window.addEventListener("keydown", this.handleLightboxKeydown);
    window.addEventListener("message", this.handleFlowFrameMessage);
    this.syncFlowExperience();
    this.syncSenseOfTimeImmersion();
  },
  beforeUnmount() {
    window.clearInterval(this.loadingTimer);
    window.removeEventListener("keydown", this.handleLightboxKeydown);
    window.removeEventListener("message", this.handleFlowFrameMessage);
    this.restoreBodyOverflow();
    document.body.classList.remove("sense-of-time-immersive");
  },
  computed: {
    detail() {
      return this.project?.details?.[this.lang] || {};
    },
    isSenseOfTime() {
      return this.project?.slug === "sense-of-time";
    },
    title() {
      return this.detail.title || this.project?.title?.[this.lang] || "";
    },
    description() {
      return this.detail.description || this.title;
    },
    titleParts() {
      return this.buildTitleParts(this.title);
    },
    hero() {
      return this.detail.hero || this.project?.image;
    },
    legacyUrl() {
      return this.project?.legacy?.[this.lang] || "";
    },
    outputImages() {
      return this.detail.images || [];
    },
    pdfs() {
      return this.detail.pdfs || [];
    },
    codeBlockRefs() {
      return this.detail.codeBlocks || [];
    },
    demoType() {
      return this.detail.demo?.type || "";
    },
    productUrl() {
      return this.detail.demo?.productUrl || "";
    },
    productLinkLabel() {
      return this.lang === "zh" ? "进入正式版工作台" : "Open full workbench";
    },
    embeds() {
      return (this.detail.iframes || []).map((src, index) => ({
        label: this.embedLabel(src, index),
        src: src.startsWith("//") ? `https:${src}` : src,
        isFlowApp: this.isFlowApp(src),
        requiresVpn: this.embedRequiresVpn(src),
        figmaUrl: this.figmaUrl(src)
      }));
    },
    flowExperienceUrl() {
      return this.embeds.find((embed) => embed.isFlowApp)?.src || "";
    },
    flowExperienceOrigin() {
      try {
        return new URL(this.flowExperienceUrl).origin;
      } catch {
        return "";
      }
    },
    loadingWords() {
      if (this.lang === "zh") return ["等待中···", "加载中···", "读取中···"];
      return ["Thinking···", "Reading···", "Loading···", "Working···"];
    },
    loadingMessage() {
      return this.loadingWords[this.loadingWordIndex % this.loadingWords.length];
    }
  },
  watch: {
    project: {
      handler() {
        this.loadedEmbeds = {};
        this.lightboxImage = "";
        this.flowInlineFrameMode = "portrait";
        this.flowOverlayFrameMode = "portrait";
        this.closeFlowExperience();
        this.$nextTick(() => {
          this.syncFlowExperience();
          this.syncSenseOfTimeImmersion();
        });
      }
    },
    codeBlockRefs: {
      handler() {
        this.loadCodeBlocks();
      },
      immediate: true
    }
  },
  methods: {
    syncSenseOfTimeImmersion() {
      document.body.classList.toggle("sense-of-time-immersive", this.isSenseOfTime);
    },
    embedLabel(src, index) {
      if (this.isFlowApp(src)) return this.lang === "zh" ? "交互体验" : "Interactive Experience";
      if (src.includes("figma.com")) return "Figma";
      if (src.includes("bilibili.com")) return "Bilibili";
      if (src.includes("vimeo.com")) return "Vimeo";
      if (src.includes("youtube.com")) return "YouTube";
      return `${this.lang === "zh" ? "嵌入内容" : "Embed"} ${index + 1}`;
    },
    isFlowApp(src) {
      return src.includes("apps-demo.muyang23333.top/flow/");
    },
    embedRequiresVpn(src) {
      return ["youtube.com", "youtu.be", "vimeo.com"].some((domain) => src.includes(domain));
    },
    figmaUrl(src) {
      if (!src.includes("embed.figma.com")) return "";
      try {
        const url = new URL(src);
        const nodeId = url.searchParams.get("node-id");
        url.hostname = "www.figma.com";
        url.searchParams.delete("embed-host");
        if (nodeId) url.searchParams.set("node-id", nodeId);
        return url.toString();
      } catch {
        return "";
      }
    },
    languageLabel(language) {
      return (language || "text").toUpperCase();
    },
    buildTitleParts(value) {
      const parts = [];
      const source = value || "";
      const separatorPattern = /\s*(———|——|—|\s+-\s+)\s*/g;
      let lastIndex = 0;
      let match;

      while ((match = separatorPattern.exec(source))) {
        if (match.index > lastIndex) {
          parts.push({
            type: "text",
            value: source.slice(lastIndex, match.index)
          });
        }

        parts.push({
          type: "separator",
          value: "·"
        });
        lastIndex = separatorPattern.lastIndex;
      }

      if (lastIndex < source.length) {
        parts.push({
          type: "text",
          value: source.slice(lastIndex)
        });
      }

      return parts.length ? parts : [{ type: "text", value: source }];
    },
    async loadCodeBlocks() {
      const refs = this.codeBlockRefs;
      if (!refs.length) {
        this.loadedCodeBlocks = [];
        return;
      }

      const blocks = await Promise.all(refs.map(async (block) => {
        try {
          const response = await fetch(block.src);
          if (!response.ok) throw new Error(`Unable to load ${block.src}`);
          return {
            ...block,
            code: await response.text()
          };
        } catch {
          return {
            ...block,
            code: this.lang === "zh" ? "代码资源加载失败" : "Code resource failed to load"
          };
        }
      }));

      this.loadedCodeBlocks = blocks;
    },
    async copyCode(block) {
      if (!navigator.clipboard || !block.code) return;
      await navigator.clipboard.writeText(block.code);
    },
    isCodeExpanded(src) {
      return Boolean(this.codeExpanded[src]);
    },
    toggleCode(src) {
      this.codeExpanded = { ...this.codeExpanded, [src]: !this.codeExpanded[src] };
    },
    isEmbedLoading(src) {
      return !this.loadedEmbeds[src];
    },
    markEmbedLoaded(src) {
      this.loadedEmbeds = {
        ...this.loadedEmbeds,
        [src]: true
      };
    },
    outputImageClass(image) {
      if (this.project?.slug !== "takeaway-logo") return {};
      return {
        "output-gallery__item--logo": !image.endsWith("/2.png"),
        "output-gallery__item--interface": image.endsWith("/2.png")
      };
    },
    isZoomableOutputImage(image) {
      if (!this.project) return false;
      if (this.project.slug === "takeaway-logo") return !image.endsWith("/2.png");
      return true;
    },
    openOutputLightbox(image) {
      if (!this.isZoomableOutputImage(image)) return;
      this.lightboxImage = image;
    },
    closeOutputLightbox() {
      this.lightboxImage = "";
    },
    syncFlowExperience() {
      if (this.project?.slug !== "flow" || !this.flowExperienceUrl) return;
      if (window.matchMedia("(max-width: 780px)").matches) {
        this.openFlowExperience();
      }
    },
    openFlowExperience() {
      if (!this.flowExperienceUrl || this.flowExperienceOpen) return;
      this.flowOverlayFrameMode = "portrait";
      this.bodyOverflowBeforeFlow = document.body.style.overflow;
      this.htmlOverflowBeforeFlow = document.documentElement.style.overflow;
      this.htmlScrollbarGutterBeforeFlow = document.documentElement.style.scrollbarGutter;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.scrollbarGutter = "auto";
      this.flowExperienceOpen = true;
    },
    closeFlowExperience() {
      if (!this.flowExperienceOpen) return;
      this.flowExperienceOpen = false;
      this.restoreBodyOverflow();
    },
    restoreBodyOverflow() {
      document.body.style.overflow = this.bodyOverflowBeforeFlow;
      document.documentElement.style.overflow = this.htmlOverflowBeforeFlow;
      document.documentElement.style.scrollbarGutter = this.htmlScrollbarGutterBeforeFlow;
      this.bodyOverflowBeforeFlow = "";
      this.htmlOverflowBeforeFlow = "";
      this.htmlScrollbarGutterBeforeFlow = "";
    },
    handleFlowFrameMessage(event) {
      if (!this.flowExperienceOrigin || event.origin !== this.flowExperienceOrigin) return;
      if (event.data?.type !== "flow-app:frame-mode") return;
      if (!["portrait", "landscape"].includes(event.data.mode)) return;

      const overlayFrame = this.$refs.flowExperienceOverlay;
      if (overlayFrame?.contentWindow === event.source) {
        this.flowOverlayFrameMode = event.data.mode;
        return;
      }

      const inlineFrame = this.$el?.querySelector(".flow-experience-frame__iframe");
      if (inlineFrame?.contentWindow === event.source) {
        this.flowInlineFrameMode = event.data.mode;
      }
    },
    handleLightboxKeydown(event) {
      if (event.key === "Escape" && this.lightboxImage) {
        this.closeOutputLightbox();
      } else if (event.key === "Escape" && this.flowExperienceOpen) {
        this.closeFlowExperience();
      }
    },
    disciplineLabel(key) {
      const labels = {
        en: {
          visual: "Visual Design",
          ui: "UI Design",
          product: "Industrial Product",
          others: "Others",
          unpublished: "Unpublished",
          "vibe-coding": "Vibe Coding"
        },
        zh: {
          visual: "视觉设计",
          ui: "UI 设计",
          product: "工业产品设计",
          others: "其他",
          unpublished: "未公开",
          "vibe-coding": "vibe coding"
        }
      };
      return labels[this.lang][key] || key;
    }
  },
  template: `
    <section v-if="project" class="project-detail" :class="'project-detail--' + project.slug">
      <div v-if="!isSenseOfTime" class="project-hero">
        <img :src="hero" :alt="title" />
        <div class="project-copy">
          <p class="project-kicker">{{ disciplineLabel(project.discipline) }}</p>
          <h1>
            <template v-for="(part, index) in titleParts" :key="index">
              <span v-if="part.type === 'separator'" class="title-separator">{{ part.value }}</span>
              <span v-else>{{ part.value }}</span>
            </template>
          </h1>
          <p>{{ description }}</p>
          <div v-if="productUrl" class="project-hero-actions">
            <a class="project-product-link" :href="productUrl" target="_blank" rel="noreferrer">
              {{ productLinkLabel }}
            </a>
          </div>
        </div>
      </div>

      <section v-if="!isSenseOfTime && pdfs.length" class="download-row">
        <a v-for="pdf in pdfs" :key="pdf" class="download-link" :href="pdf" target="_blank" rel="noreferrer">
          {{ lang === 'zh' ? '项目 PDF 下载' : 'Project PDF download' }}
        </a>
      </section>

      <TaskMapDemo v-if="demoType === 'task-map'" :lang="lang" :product-url="detail.demo?.productUrl || ''" />
      <AIWorkflowDemo v-if="demoType === 'ai-workflow'" :lang="lang" />
      <SenseOfTimeDemo v-if="project.slug === 'sense-of-time'" :lang="lang" />
      <BeautyIndustryViz v-if="project.slug === 'beauty-information-visualisation'" :lang="lang" />

      <section v-if="!isSenseOfTime && outputImages.length" class="output-gallery">
        <figure
          v-for="image in outputImages"
          :key="image"
          class="output-gallery__item"
          :class="[outputImageClass(image), { 'output-gallery__item--zoomable': isZoomableOutputImage(image) }]"
        >
          <button
            v-if="isZoomableOutputImage(image)"
            type="button"
            class="output-gallery__button"
            :aria-label="lang === 'zh' ? '全屏查看图片' : 'View image fullscreen'"
            @click="openOutputLightbox(image)"
          >
            <img class="output-gallery__image" :src="image" :alt="title" />
          </button>
          <img v-else class="output-gallery__image" :src="image" :alt="title" />
        </figure>
      </section>

      <Transition name="image-lightbox">
        <div
          v-if="lightboxImage"
          class="image-lightbox"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          @click.self="closeOutputLightbox"
        >
          <button type="button" class="image-lightbox__close" @click="closeOutputLightbox">
            {{ lang === 'zh' ? '返回' : 'Back' }}
          </button>
          <img class="image-lightbox__image" :src="lightboxImage" :alt="title" />
        </div>
      </Transition>

      <Transition name="flow-experience">
        <div
          v-if="flowExperienceOpen && flowExperienceUrl"
          class="flow-experience-overlay"
          role="dialog"
          aria-modal="true"
          :aria-label="lang === 'zh' ? '流 App 专注交互体验' : 'Flow App focused experience'"
        >
          <div
            class="flow-experience-overlay__stage"
            :class="'flow-experience-overlay__stage--' + flowOverlayFrameMode"
          >
            <iframe
              class="flow-experience-overlay__iframe"
              :class="'flow-experience-overlay__iframe--' + flowOverlayFrameMode"
              ref="flowExperienceOverlay"
              :src="flowExperienceUrl"
              :title="lang === 'zh' ? '流 App 交互体验' : 'Flow App interactive experience'"
              allow="fullscreen; autoplay"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
          <button type="button" class="flow-experience-overlay__close" @click="closeFlowExperience">
            {{ lang === 'zh' ? '返回作品' : 'Back to project' }}
          </button>
        </div>
      </Transition>

      <section v-if="!isSenseOfTime && loadedCodeBlocks.length" class="code-stack">
        <article v-for="block in loadedCodeBlocks" :key="block.src" class="code-panel">
          <header class="code-panel__header">
            <div>
              <h2>{{ block.title }}</h2>
              <span>{{ languageLabel(block.language) }}</span>
            </div>
            <div class="code-panel__actions">
              <button type="button" class="code-toggle" :aria-expanded="isCodeExpanded(block.src)" @click="toggleCode(block.src)">
                {{ isCodeExpanded(block.src) ? (lang === 'zh' ? '收起源码' : 'Hide source') : (lang === 'zh' ? '展开源码' : 'Show source') }}
              </button>
              <button v-if="isCodeExpanded(block.src)" type="button" class="code-copy" @click="copyCode(block)">
                {{ lang === 'zh' ? '复制' : 'Copy' }}
              </button>
            </div>
          </header>
          <p v-if="isCodeExpanded(block.src)" class="code-mobile-note">
            {{ lang === 'zh' ? '代码细节详见 PC 端网页' : 'Code details are available on the desktop site' }}
          </p>
          <pre v-if="isCodeExpanded(block.src)" class="code-panel__body"><code :class="'language-' + block.language">{{ block.code }}</code></pre>
        </article>
      </section>

      <section v-if="!isSenseOfTime && embeds.length" class="embed-stack">
        <article
          v-for="embed in embeds"
          :key="embed.src"
          class="embed-panel"
          :class="{
            'embed-panel--figma': embed.label === 'Figma',
            'embed-panel--flow': embed.isFlowApp,
            'embed-panel--loading': embed.label === 'Figma' && isEmbedLoading(embed.src)
          }"
        >
          <div class="embed-panel__heading">
            <h2>{{ embed.label }}</h2>
            <button
              v-if="embed.isFlowApp"
              type="button"
              class="flow-experience-launch"
              @click="openFlowExperience"
            >
              {{ lang === 'zh' ? '专注体验' : 'Focused experience' }}
            </button>
          </div>
          <div
            v-if="embed.label === 'Figma' && isEmbedLoading(embed.src)"
            class="figma-loader"
            role="status"
            aria-live="polite"
            :aria-label="loadingMessage"
          >
            <span :key="loadingMessage" class="figma-loader__message">{{ loadingMessage }}</span>
            <span class="figma-loader__rule"></span>
          </div>
          <div
            :class="{
              'flow-experience-frame': embed.isFlowApp,
              'flow-experience-frame--landscape': embed.isFlowApp && flowInlineFrameMode === 'landscape'
            }"
          >
            <iframe
              :key="embed.src + '-' + project.slug"
              :src="embed.src"
              :title="embed.label"
              :class="{ 'flow-experience-frame__iframe': embed.isFlowApp }"
              loading="lazy"
              allow="fullscreen; autoplay"
              referrerpolicy="strict-origin-when-cross-origin"
              @load="markEmbedLoaded(embed.src)"
            ></iframe>
          </div>
          <p v-if="embed.requiresVpn" class="embed-note">
            {{ lang === 'zh' ? '需 VPN 观看' : 'VPN required to view' }}
          </p>
        </article>
      </section>
    </section>
    <section v-else class="project-detail project-detail--empty">
      <h1>{{ lang === 'zh' ? '作品未找到' : 'Project not found' }}</h1>
      <a class="text-link" :href="'#/' + lang + '/projects/school'">
        {{ lang === 'zh' ? '返回作品列表' : 'Back to projects' }}
      </a>
    </section>
  `
};
