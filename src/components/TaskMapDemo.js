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
            intro: "从一个总目标出发，先把复杂任务拆成清晰结构，再进入甘特图安排时间、承接关系与导出交付。",
            openProduct: "进入正式工作台",
            note: "按功能步骤重新排布：先确定任务结构，再拖动时间条完成粗排，随后精细化任务承接关系，最后导出为本地可查看文件。",
            scrollHint: "点击切换任务规划流程",
            steps: [
              {
                index: "01",
                marker: "一",
                title: "确定任务结构",
                body: "支持 AI 拆解复杂任务提供思路",
                image: "/images/work/task-map-introduce/structure.png"
              },
              {
                index: "02",
                marker: "二",
                title: "确定任务及子任务节点时间",
                body: "拖动粗调时间换行",
                image: "/images/work/task-map-introduce/flow.png"
              },
              {
                index: "03",
                marker: "三",
                title: "确定同级任务承接关系",
                body: "精细化调整时间",
                image: "/images/work/task-map-introduce/timeline.png"
              },
              {
                index: "04",
                marker: "四",
                title: "导出 PDF 或可交互 HTML",
                body: "进行本地查看，后续上线 App 支持反复更改",
                image: "/images/work/task-map-introduce/export.png"
              }
            ]
          }
        : {
            kicker: "Vibe Coding / Product Logic",
            title: "AI Task Gantt Studio",
            intro: "Start from one root goal, clarify the task structure first, then arrange timing, sequencing, and exportable delivery in a Gantt workspace.",
            openProduct: "Open Full Workspace",
            note: "The workflow is organized into four steps: define structure, rough out timing, refine dependencies, and export files for local reading.",
            scrollHint: "Click to switch planning steps",
            steps: [
              {
                index: "01",
                marker: "I",
                title: "Define Task Structure",
                body: "Use AI breakdown to find directions for complex work.",
                image: "/images/work/task-map-introduce/structure.png"
              },
              {
                index: "02",
                marker: "II",
                title: "Set Task Timing",
                body: "Drag bars to rough out task length and rows.",
                image: "/images/work/task-map-introduce/flow.png"
              },
              {
                index: "03",
                marker: "III",
                title: "Refine Dependencies",
                body: "Tune sibling task order and precise timing.",
                image: "/images/work/task-map-introduce/timeline.png"
              },
              {
                index: "04",
                marker: "IV",
                title: "Export PDF or HTML",
                body: "Open locally now; future App support keeps the plan editable.",
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
        </div>
      </div>

      <div class="task-map-story__single-copy" aria-live="polite">
        <span>{{ activeStep.marker || activeStep.index }}</span>
        <div>
          <strong>{{ activeStep.title }}</strong>
          <small>{{ activeStep.body }}</small>
        </div>
      </div>
    </section>
  `
};
