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
  computed: {
    formalUrl() {
      return this.productUrl || "http://muyang-tool.noteach.com.cn/task-map/";
    },
    labels() {
      return this.lang === "zh"
        ? {
            kicker: "Vibe Coding / Product Logic",
            title: "AI 任务甘特图工作台",
            intro: "作品集页保留产品思路说明，完整交互进入正式工作台体验：先拆结构，再排时间，最后导出可交互结果。",
            openProduct: "进入正式工作台",
            note: "正式版支持思维导图、AI 拆解、甘特图拖拽、日期输入、交互 HTML 与 PDF 导出。",
            scrollHint: "横向滑动查看使用流程",
            steps: [
              {
                index: "01",
                title: "一个总目标",
                body: "最高父级只保留一个 root 目标，避免计划从一开始就散掉。用户可以直接重命名总目标，再向下无限拆解。"
              },
              {
                index: "02",
                title: "先结构，后时间",
                body: "第一阶段像幕布一样梳理层级关系；AI 只在叶子节点上生成下一层建议，不提前混入日期与时长。"
              },
              {
                index: "03",
                title: "进入甘特图精排",
                body: "结构确定后再拖动时间条。父任务自动继承子任务范围，同级任务可以放入同一轨道形成承接关系。"
              },
              {
                index: "04",
                title: "导出与交付",
                body: "规划结果可以导出为层级 To-do PDF，也可以导出包含思维导图与可展开甘特图的交互 HTML。"
              }
            ]
          }
        : {
            kicker: "Vibe Coding / Product Logic",
            title: "AI Task Gantt Studio",
            intro: "The portfolio page now keeps the product logic. Open the full workspace for the complete flow: structure first, schedule later, then export.",
            openProduct: "Open Full Workspace",
            note: "The full version supports mind maps, AI breakdown, Gantt dragging, flexible date input, interactive HTML export, and PDF export.",
            scrollHint: "Scroll horizontally to read the flow",
            steps: [
              {
                index: "01",
                title: "One Root Goal",
                body: "Keep a single root goal so the plan stays focused. Rename it directly, then keep decomposing downward."
              },
              {
                index: "02",
                title: "Structure First",
                body: "The first stage works like a structured outline. AI only expands leaf nodes by one level and avoids scheduling too early."
              },
              {
                index: "03",
                title: "Schedule in Gantt",
                body: "After structure is stable, drag timeline bars. Parent ranges inherit children, and sibling tasks can share a lane to create sequence links."
              },
              {
                index: "04",
                title: "Export and Share",
                body: "Export the result as a hierarchical To-do PDF or as one interactive HTML file with a mind map and expandable Gantt chart."
              }
            ]
          };
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

      <div class="task-map-story__rail" tabindex="0" :aria-label="labels.scrollHint">
        <article v-for="step in labels.steps" :key="step.index" class="task-map-story__slide">
          <span>{{ step.index }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
        </article>
      </div>
    </section>
  `
};
