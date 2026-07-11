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
    labels() {
      return this.lang === "zh"
        ? {
            overview: {
              eyebrow: "Product Overview",
              title: "一个总目标，先拆结构，再排时间。",
              lead: "Task Map 把任务规划拆成两个清晰阶段：先像幕布一样整理层级与逻辑关系，再把确定下来的任务放进甘特图里安排时间、顺承关系和执行节奏。",
              body: "这个项目不是简单的待办清单，而是一个面向复杂目标的规划工作台。它保留无限嵌套、AI 辅助拆解、任务条拖动和可交互导出的核心能力，让思路从混乱目标逐步变成可执行方案。",
              meta: [
                "单一 Root 总目标",
                "AI 辅助一层拆解",
                "思维导图到甘特图",
                "PDF / 交互 HTML 导出"
              ]
            },
            why: {
              eyebrow: "Why",
              title: "规划工具最难的不是写下任务，而是让结构和时间分开变清楚。",
              items: [
                {
                  title: "结构优先",
                  body: "先确认任务之间的父子关系、并列关系和拆解边界，避免一开始就被日期输入打断思考。"
                },
                {
                  title: "时间后置",
                  body: "当任务结构稳定以后，再进入甘特图中通过拖动时间条处理顺序、并行和依赖关系。"
                },
                {
                  title: "AI 只做辅助",
                  body: "AI 拆解只向下生成一层建议，默认并入结构树，用户可以继续手动增删改。"
                },
                {
                  title: "导出可交付",
                  body: "规划结果既能导出为阅读型清单 PDF，也能导出为可展开收起的本地 HTML。"
                }
              ]
            },
            steps: [
              {
                index: "Step 01",
                title: "确定任务结构",
                body: "从唯一的总目标开始，用键盘或鼠标建立上下级任务。叶子节点可以调用 AI 生成 3 到 6 个子任务建议，快速获得第一层拆解方向。",
                image: "/images/work/task-map-introduce/step-01.png"
              },
              {
                index: "Step 02",
                title: "建立任务依赖关系",
                body: "把同级任务拖到同一轨道时形成顺承关系，同轨任务避免时间重叠，并用连接线提示先后依赖。",
                image: "/images/work/task-map-introduce/step-02.png"
              },
              {
                index: "Step 03",
                title: "生成时间规划",
                body: "进入甘特图后，根据父级范围初步安排子任务时间，再通过两端控制点、轨道拖动和弹窗输入进行精细化调整。",
                image: "/images/work/task-map-introduce/step-03.png"
              },
              {
                index: "Step 04",
                title: "导出执行方案",
                body: "导出保留层级关系的清单 PDF，或导出一个无需服务器即可打开的交互 HTML，在浏览器中切换思维导图和甘特图。",
                image: "/images/work/task-map-introduce/step-04.png"
              }
            ],
            status: {
              eyebrow: "Current Status",
              title: "Demo 已冻结，正式工作台继续演进。",
              body: "作品集页面保留产品思路与流程说明；完整功能集中在正式工具集页面继续迭代。当前版本已具备结构拆解、甘特图拖动、全屏查看、PDF 和交互 HTML 导出等主流程。"
            }
          }
        : {
            overview: {
              eyebrow: "Product Overview",
              title: "One root goal, infinite structure, then timeline planning.",
              lead: "Task Map separates planning into two deliberate stages: first clarify hierarchy and logic like an outliner, then arrange time, sequencing, and execution rhythm in a Gantt view.",
              body: "It is not just a to-do list. It is a workbench for complex goals, combining infinite nesting, AI-assisted breakdown, draggable timeline bars, and exportable plans.",
              meta: [
                "Single root goal",
                "One-level AI breakdown",
                "Mind map to Gantt",
                "PDF / interactive HTML export"
              ]
            },
            why: {
              eyebrow: "Why",
              title: "The hard part of planning is separating structure from time.",
              items: [
                {
                  title: "Structure first",
                  body: "Clarify parent-child hierarchy, sibling groups, and breakdown boundaries before dates interrupt thinking."
                },
                {
                  title: "Time second",
                  body: "After the structure is stable, move into the Gantt view to handle order, overlap, and dependency."
                },
                {
                  title: "AI as support",
                  body: "AI only generates one layer of suggestions and merges them into the task tree for later manual editing."
                },
                {
                  title: "Exportable delivery",
                  body: "The plan can become a readable PDF checklist or a local interactive HTML file with collapsible views."
                }
              ]
            },
            steps: [
              {
                index: "Step 01",
                title: "Define Task Structure",
                body: "Start from one root goal, then create parent and child tasks by keyboard or mouse. Leaf nodes can call AI for three to six child suggestions.",
                image: "/images/work/task-map-introduce/step-01.png"
              },
              {
                index: "Step 02",
                title: "Build Dependencies",
                body: "Dragging sibling tasks onto the same track creates a sequential relationship. Same-track tasks avoid overlap and use connecting lines to show dependency.",
                image: "/images/work/task-map-introduce/step-02.png"
              },
              {
                index: "Step 03",
                title: "Generate Timeline",
                body: "In the Gantt view, child timing starts from the parent range, then can be refined with end handles, track dragging, and date input.",
                image: "/images/work/task-map-introduce/step-03.png"
              },
              {
                index: "Step 04",
                title: "Export Execution Plan",
                body: "Export a hierarchical PDF checklist or a serverless interactive HTML file that switches between mind map and Gantt views.",
                image: "/images/work/task-map-introduce/step-04.png"
              }
            ],
            status: {
              eyebrow: "Current Status",
              title: "The portfolio demo is frozen; the full workbench keeps evolving.",
              body: "The portfolio page now presents the product thinking and workflow. The complete tool continues in the formal toolkit, with structure editing, Gantt dragging, fullscreen view, PDF export, and interactive HTML export in place."
            }
          };
    }
  },
  template: `
    <section class="task-map-project-story" aria-label="Task Map product story">
      <section class="task-map-project-section task-map-project-overview">
        <div class="task-map-project-copy">
          <p class="task-map-project-eyebrow">{{ labels.overview.eyebrow }}</p>
          <h2>{{ labels.overview.title }}</h2>
        </div>
        <div class="task-map-project-copy task-map-project-copy--body">
          <p class="task-map-project-lead">{{ labels.overview.lead }}</p>
          <p>{{ labels.overview.body }}</p>
          <ul class="task-map-project-meta">
            <li v-for="item in labels.overview.meta" :key="item">{{ item }}</li>
          </ul>
        </div>
      </section>

      <section class="task-map-project-section task-map-project-why">
        <div class="task-map-project-copy">
          <p class="task-map-project-eyebrow">{{ labels.why.eyebrow }}</p>
          <h2>{{ labels.why.title }}</h2>
        </div>
        <div class="task-map-project-why-grid">
          <article v-for="item in labels.why.items" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
        </div>
      </section>

      <section class="task-map-project-section task-map-project-steps" aria-label="Task Map workflow">
        <article v-for="step in labels.steps" :key="step.index" class="task-map-project-step">
          <div class="task-map-project-step__copy">
            <p class="task-map-project-eyebrow">{{ step.index }}</p>
            <h3>{{ step.title }}</h3>
            <p>{{ step.body }}</p>
          </div>
          <figure class="task-map-project-step__figure">
            <figcaption>{{ step.title }}</figcaption>
            <img :src="step.image" :alt="step.title" loading="lazy">
          </figure>
        </article>
      </section>

      <section class="task-map-project-section task-map-project-status">
        <p class="task-map-project-eyebrow">{{ labels.status.eyebrow }}</p>
        <h2>{{ labels.status.title }}</h2>
        <p>{{ labels.status.body }}</p>
      </section>
    </section>
  `
};
