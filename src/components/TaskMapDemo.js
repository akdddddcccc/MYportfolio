export default {
  name: "TaskMapDemo",
  props: {
    lang: {
      type: String,
      required: true
    },
    productUrl: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      activeStepIndex: 0
    };
  },
  computed: {
    formalUrl() {
      return this.productUrl || "http://muyang-tool.noteach.com.cn/task-map/";
    },
    activeStep() {
      return this.labels.steps[this.activeStepIndex] || this.labels.steps[0];
    },
    labels() {
      return this.lang === "zh"
        ? {
            kicker: "Vibe Coding / Product Logic",
            title: "AI 任务甘特图工作台",
            intro: "从一个总目标出发，先用思维导图拆出任务结构，再进入甘特图进行时间精排，最后把规划导出为可交付文件。",
            openProduct: "进入正式工作台",
            note: "正式版支持思维导图、AI 拆解、甘特图拖拽、日期输入、全屏操作、交互 HTML 与 PDF 导出。",
            scrollHint: "横向滑动查看使用流程",
            steps: [
              {
                index: "01",
                title: "一个总目标",
                body: "最高父级只保留一个 root 目标，避免计划从一开始就散掉。用户可以直接重命名总目标，再向下无限拆解。",
                image: "/images/work/task-map-introduce/structure.png"
              },
              {
                index: "02",
                title: "先结构，后时间",
                body: "第一阶段先像幕布一样梳理层级关系；AI 只在叶子节点上生成下一层建议，不提前混入日期与时长。",
                image: "/images/work/task-map-introduce/flow.png"
              },
              {
                index: "03",
                title: "进入甘特图精排",
                body: "结构确定后再进入时间轴。任务条可拖动、缩放、聚焦和全屏编辑，父任务自动继承子任务范围。",
                image: "/images/work/task-map-introduce/timeline.png"
              },
              {
                index: "04",
                title: "导出与交付",
                body: "规划结果可以导出为层级 To-do PDF，也可以导出包含思维导图与可展开甘特图的交互 HTML。",
                image: "/images/work/task-map-introduce/export.png"
              }
            ]
          }
        : {
            kicker: "Vibe Coding / Product Logic",
            title: "AI Task Gantt Studio",
            intro: "Start from one root goal, decompose the task structure in a mind map, refine timing in a Gantt view, then export the plan for delivery.",
            openProduct: "Open Full Workspace",
            note: "The full version supports mind maps, AI breakdown, Gantt dragging, flexible date input, fullscreen editing, interactive HTML export, and PDF export.",
            scrollHint: "Scroll horizontally to read the flow",
            steps: [
              {
                index: "01",
                title: "One Root Goal",
                body: "Keep a single root goal so the plan stays focused. Rename it directly, then keep decomposing downward.",
                image: "/images/work/task-map-introduce/structure.png"
              },
              {
                index: "02",
                title: "Structure First",
                body: "The first stage works like a structured outline. AI only expands leaf nodes by one level and avoids scheduling too early.",
                image: "/images/work/task-map-introduce/flow.png"
              },
              {
                index: "03",
                title: "Schedule in Gantt",
                body: "After structure is stable, move into the timeline. Bars can be dragged, resized, focused, and edited fullscreen.",
                image: "/images/work/task-map-introduce/timeline.png"
              },
              {
                index: "04",
                title: "Export and Share",
                body: "Export the result as a hierarchical To-do PDF or as one interactive HTML file with a mind map and expandable Gantt chart.",
                image: "/images/work/task-map-introduce/export.png"
              }
            ]
          };
    }
  },
  methods: {
    setActiveStep(index) {
      this.activeStepIndex = index;
    },
    screenClass(index) {
      if (index === this.activeStepIndex) return "active";
      if (index === this.activeStepIndex - 1) return "previous";
      if (index === this.activeStepIndex + 1) return "next";
      return index < this.activeStepIndex ? "far-previous" : "far-next";
    }
  },
  template: `
    <section class="task-map-demo task-map-story" aria-label="Task Map product story">
      <div class="task-map-demo__intro task-map-story__intro">
        <div>
          <p class="task-map-demo__kicker">{{ labels.kicker }}</p>
          <h2>{{ labels.title }}</h2>
          <p>{{ labels.intro }}</p>
        </div>
        <div class="task-map-demo__actions task-map-story__actions">
          <a class="task-map-product-link" :href="formalUrl" target="_blank" rel="noreferrer">
            {{ labels.openProduct }}
          </a>
          <span>{{ labels.note }}</span>
        </div>
      </div>

      <div class="task-map-story__process">
        <div class="task-map-story__progress" role="tablist" :aria-label="labels.scrollHint">
          <button
            v-for="(step, index) in labels.steps"
            :key="step.index"
            :class="{ active: index === activeStepIndex }"
            type="button"
            role="tab"
            :aria-selected="index === activeStepIndex"
            @click="setActiveStep(index)"
          >
            <i aria-hidden="true"></i>
            <span>{{ step.index }}</span>
          </button>
        </div>

        <div class="task-map-story__viewer">
          <figure
            v-for="(step, index) in labels.steps"
            :key="step.image"
            :class="['task-map-story__screen', screenClass(index)]"
            :aria-hidden="index !== activeStepIndex"
          >
            <img :src="step.image" :alt="step.title" loading="lazy">
          </figure>

          <div class="task-map-story__active-copy">
            <span>{{ activeStep.index }}</span>
            <h3>{{ activeStep.title }}</h3>
            <p>{{ activeStep.body }}</p>
          </div>
        </div>
      </div>

      <div class="task-map-story__step-grid">
        <button
          v-for="(step, index) in labels.steps"
          :key="step.index"
          :class="{ active: index === activeStepIndex }"
          type="button"
          @click="setActiveStep(index)"
        >
          <span>{{ step.index }}</span>
          <strong>{{ step.title }}</strong>
          <small>{{ step.body }}</small>
        </button>
      </div>
    </section>
  `
};
