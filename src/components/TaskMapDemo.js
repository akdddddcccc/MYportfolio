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
      activeId: "task-2",
      hoverId: "",
      draggingMapId: "",
      dropTargetId: "",
      timelineDrag: null,
      overviewDrag: null,
      timelineExpandedIds: ["task-1"],
      isTimelineFullscreen: false,
      viewStart: "",
      viewEnd: "",
      detailTaskId: "",
      detailPopover: {
        x: 320,
        y: 120
      },
      exportMessage: "",
      aiPrompt: "准备 2027 考研备考计划",
      aiMessage: "",
      aiLoadingId: "",
      aiBreakdownUsed: 0,
      aiBreakdownLimit: 5,
      apiBase: typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)
        ? "http://127.0.0.1:8787"
        : "",
      tasks: [
        {
          id: "task-1",
          parentId: null,
          title: "2027 考研上岸计划",
          note: "最高级只保留一个总目标，所有备考阶段都挂在这个目标下面。",
          mode: "locked",
          start: "2026-06-10",
          end: "2026-12-21",
          ddl: "2026-12-21T08:30",
          done: false,
          timelineLane: 0
        },
        {
          id: "task-2",
          parentId: "task-1",
          title: "确定院校与专业",
          note: "锁定目标院校、专业方向和考试科目，整理参考书与历年分数线。",
          mode: "auto",
          start: "2026-06-10",
          end: "2026-06-24",
          ddl: "2026-06-24T22:00",
          done: true,
          timelineLane: 0
        },
        {
          id: "task-3",
          parentId: "task-1",
          title: "英语与政治基础",
          note: "英语单词、长难句和政治基础课同步推进，先建立每日稳定节奏。",
          mode: "auto",
          start: "2026-06-17",
          end: "2026-08-15",
          ddl: "2026-08-15T22:00",
          done: false,
          timelineLane: 1
        },
        {
          id: "task-4",
          parentId: "task-1",
          title: "专业课一轮框架",
          note: "按章节建立知识树，先把核心概念、题型和参考书页码对应起来。",
          mode: "auto",
          start: "2026-06-25",
          end: "2026-08-31",
          ddl: "2026-08-31T22:00",
          done: false,
          timelineLane: 2
        },
        {
          id: "task-5",
          parentId: "task-1",
          title: "暑期强化刷题",
          note: "进入题型训练和错题复盘，强化阶段不再只看课，要把输出量拉上来。",
          mode: "auto",
          start: "2026-07-20",
          end: "2026-09-20",
          ddl: "2026-09-20T22:00",
          done: false,
          timelineLane: 3
        },
        {
          id: "task-6",
          parentId: "task-5",
          title: "数学每日套题",
          note: "每周至少两次限时训练，错题回收到专业/公共课错题表。",
          mode: "auto",
          start: "2026-07-20",
          end: "2026-09-05",
          ddl: "2026-09-05T22:00",
          done: false,
          timelineLane: 0
        },
        {
          id: "task-7",
          parentId: "task-1",
          title: "真题与模考冲刺",
          note: "按考试时间做成套真题，模考后只修最影响分数的漏洞。",
          mode: "auto",
          start: "2026-09-21",
          end: "2026-11-30",
          ddl: "2026-11-30T22:00",
          done: false,
          timelineLane: 4
        },
        {
          id: "task-8",
          parentId: "task-1",
          title: "考前收束与复盘",
          note: "停止盲目扩展资料，只保留错题、背诵清单和考前作息。",
          mode: "auto",
          start: "2026-12-01",
          end: "2026-12-21",
          ddl: "2026-12-21T08:30",
          done: false,
          timelineLane: 5
        }
      ]
    };
  },
  mounted() {
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
  },
  beforeUnmount() {
    this.removeTimelineListeners();
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
  },
  computed: {
    labels() {
      return this.lang === "zh"
        ? {
            kicker: "Vibe Coding / Interaction Prototype",
            title: "Task Map：以考研为例，先梳理结构，再安排时间",
            intro: "这个 demo 以考研备考为案例：最高级只保留一个总目标，所有阶段都挂在它下面；AI 只提供拆解思路与初步时间划分，真正的结构关系和时间范围由用户在思维导图与甘特图中拖动确定。",
            mindMap: "思维导图",
            schedule: "时间轴 / 甘特结构",
            aiTitle: "AI 拆解建议",
            aiPlaceholder: "输入一个模糊目标，例如：准备 2027 考研备考计划",
            aiGenerate: "生成拆解建议",
            aiMessage: "已生成下一层子任务，可继续手动编辑或拆分叶子节点",
            aiLoading: "AI 拆解中...",
            aiUsedUp: "Demo 次数已用完，可前往正式版体验完整功能。",
            aiNodeHasChildren: "已有子任务，可继续编辑，或拆分更下层叶子节点。",
            aiUnavailable: "AI 拆解暂不可用，请稍后重试。",
            aiQuota: "AI 拆解",
            aiFallbackMessage: "已使用本地预览拆解，正式环境将优先调用 DeepSeek。",
            canvasHint: "点击节点选中；拖动节点到另一个节点上可改变层级；最高级只允许一个总目标。",
            hierarchyHint: "AI 只负责给拆解思路。思维导图负责层级，时间轴中双击任务可打开精细编辑贴片。",
            childPreview: "下一级子任务",
            noChildPreview: "当前节点暂无下一级子任务",
            ganttHint: "甘特图保留层级缩进，父任务显示整体范围，子任务显示具体执行段。",
            trackHint: "点击任务展开一层；同级任务可拖到同一轨道，时间顺序会以连线呈现。拖动两端调整范围，较宽的中段可整体移动。",
            expandAll: "展开全部",
            collapseAll: "收起层级",
            fullscreen: "全屏时间规划",
            exitFullscreen: "退出全屏",
            resizeStart: "拖动左端，调整开始时间",
            resizeEnd: "拖动右端，调整结束时间",
            moveTask: "拖动中段，移动整个任务",
            expandChildren: "展开下一级子任务",
            collapseChildren: "收起下一级子任务",
            lightSchedule: "轻量时间提示",
            dateOptional: "日期是后置提示，不再作为创建任务的必填表单。",
            addChildInline: "添加子任务",
            addSiblingInline: "添加同级任务",
            promoteInline: "升级层级",
            deleteTask: "删除节点",
            keyboardHint: "键盘：Tab 添加子任务，Enter 新增同级，Shift+Tab 升级，Delete 删除。",
            ddl: "DDL",
            ddlHint: "DDL 可精确到日期与小时；持续时间请在右侧甘特图中拖动确定。",
            dragRangeHint: "拖动黑色任务条即可重新确定任务范围。",
            timeOverview: "时间总览",
            overviewHint: "拖动中间滑轨移动视图；拖动两侧把手缩放时间范围。",
            overviewFullHint: "当前已适配全部时间范围；拖动两侧把手可聚焦局部时间。",
            fitTimeline: "显示全部时间",
            overviewWindow: "拖动时间总览滑轨，移动当前视图范围",
            overviewStartHandle: "拖动左侧把手，调整视图开始日期",
            overviewEndHandle: "拖动右侧把手，调整视图结束日期",
            taskBarDragLabel: "拖动任务条调整时间，双击打开编辑贴片",
            childPeekHint: "悬停任务条可向下查看一级子任务。",
            aiSplit: "AI 拆解",
            selected: "选中节点",
            addRoot: "根目标",
            addChild: "子任务",
            addSibling: "同级任务",
            exportHtml: "导出互动 HTML",
            exportPdf: "导出 PDF",
            fullProductReady: "打开完整产品",
            fullProductPending: "完整产品库筹备中",
            demoMode: "作品集 Demo",
            demoScope: "结构拆分 / 时间规划 / 导出",
            repoMode: "独立库方向",
            repoScope: "Web 产品 / PC 端 / 核心逻辑",
            freezeMode: "作品集冻结版",
            freezeScope: "Demo 完成后仅保留入口",
            clearCaseData: "清空案例数据",
            clearCaseMessage: "案例数据已清空，可以从一个空白总目标开始尝试。",
            scratchRootTitle: "新的总目标",
            scratchRootNote: "从这里开始改标题、加子任务、拖动时间条，搭建自己的计划。",
            complete: "完成",
            completed: "已完成",
            auto: "自动汇总",
            locked: "手动锁定",
            start: "开始",
            end: "截止",
            note: "备注",
            parent: "父级",
            noParent: "根节点",
            timeline: "时间轴",
            openDetail: "双击编辑",
            closeDetail: "关闭",
            doubleClickHint: "双击任意时间轴任务，打开选中节点的精细化编辑贴片。",
            rootLocked: "最高级任务只能有一个，已在总目标下添加阶段。",
            rootProtected: "总目标不能删除；可以删除或调整它下面的阶段。",
            conflict: "超出锁定父任务范围",
            exportReady: "已生成下载文件",
            printHint: "请在打印窗口中选择保存为 PDF"
          }
        : {
            kicker: "Vibe Coding / Interaction Prototype",
            title: "Task Map: exam prep structure first, schedule later",
            intro: "This demo uses postgraduate exam prep as the case: only one top-level goal is allowed, every phase lives under it, and users confirm structure and time ranges by dragging the mind map and Gantt bars.",
            mindMap: "Mind map",
            schedule: "Timeline / Gantt structure",
            aiTitle: "AI breakdown suggestions",
            aiPlaceholder: "Type a fuzzy goal, e.g. prepare for the 2027 postgraduate exam",
            aiGenerate: "Generate breakdown",
            aiMessage: "Next-level child tasks were generated. Keep editing or split leaf nodes.",
            aiLoading: "AI splitting...",
            aiUsedUp: "Demo uses are finished. Open the full product for unlimited use.",
            aiNodeHasChildren: "This node already has children. Edit them or split a deeper leaf node.",
            aiUnavailable: "AI breakdown is temporarily unavailable. Please try again later.",
            aiQuota: "AI splits",
            aiFallbackMessage: "Local preview breakdown was used. Production will prefer DeepSeek.",
            canvasHint: "Click to select. Drag a node onto another node to change hierarchy. Only one top-level goal is allowed.",
            hierarchyHint: "AI only suggests breakdown ideas. The mind map owns hierarchy; double-click a timeline row to edit details.",
            childPreview: "Next-level children",
            noChildPreview: "No next-level children yet",
            ganttHint: "The Gantt view keeps hierarchy indentation: parent nodes show an overall range and child nodes show execution spans.",
            trackHint: "Click a task to reveal one level. Drag siblings onto a shared track to show sequence links. Resize from either edge; move wide bars from their center.",
            expandAll: "Expand all",
            collapseAll: "Collapse levels",
            fullscreen: "Fullscreen schedule",
            exitFullscreen: "Exit fullscreen",
            resizeStart: "Drag left edge to adjust start time",
            resizeEnd: "Drag right edge to adjust end time",
            moveTask: "Drag center to move the whole task",
            expandChildren: "Expand next-level children",
            collapseChildren: "Collapse next-level children",
            lightSchedule: "Light time signal",
            dateOptional: "Dates are optional later signals, not required creation fields.",
            addChildInline: "Add child task",
            addSiblingInline: "Add sibling task",
            promoteInline: "Promote level",
            deleteTask: "Delete node",
            keyboardHint: "Keyboard: Tab adds a child, Enter adds a sibling, Shift+Tab promotes, Delete removes.",
            ddl: "DDL",
            ddlHint: "DDL can be precise to date and hour. Drag Gantt bars to define duration ranges.",
            dragRangeHint: "Drag the black task bar to redefine the task range.",
            timeOverview: "Time overview",
            overviewHint: "Drag the middle rail to move the view. Drag either handle to resize the visible range.",
            overviewFullHint: "The complete time range is already visible. Drag either handle to focus on a shorter period.",
            fitTimeline: "Show full range",
            overviewWindow: "Drag the time overview rail to move the current view range",
            overviewStartHandle: "Drag the left handle to adjust the view start date",
            overviewEndHandle: "Drag the right handle to adjust the view end date",
            taskBarDragLabel: "Drag the task bar to adjust time. Double-click to edit details",
            childPeekHint: "Hover a task bar to reveal first-level child tasks below.",
            aiSplit: "AI split",
            selected: "Selected node",
            addRoot: "Root goal",
            addChild: "Child task",
            addSibling: "Sibling task",
            exportHtml: "Export interactive HTML",
            exportPdf: "Export PDF",
            fullProductReady: "Open full product",
            fullProductPending: "Product repo pending",
            demoMode: "Portfolio demo",
            demoScope: "Structure / timeline / export",
            repoMode: "Separate repo path",
            repoScope: "Web app / desktop / core logic",
            freezeMode: "Portfolio freeze",
            freezeScope: "Keep demo and product entry",
            clearCaseData: "Clear case data",
            clearCaseMessage: "Case data cleared. Start from a blank top-level goal.",
            scratchRootTitle: "New top-level goal",
            scratchRootNote: "Rename this, add child tasks, and drag bars to build your own plan.",
            complete: "Complete",
            completed: "Completed",
            auto: "Auto range",
            locked: "Locked range",
            start: "Start",
            end: "Due",
            note: "Note",
            parent: "Parent",
            noParent: "Root",
            timeline: "Timeline",
            openDetail: "Double-click to edit",
            closeDetail: "Close",
            doubleClickHint: "Double-click any timeline task to open the selected-node detail patch.",
            rootLocked: "Only one top-level task is allowed. A phase was added under the root goal.",
            rootProtected: "The root goal cannot be deleted; edit or remove its phases instead.",
            conflict: "Outside locked parent range",
            exportReady: "Download file generated",
            printHint: "Choose Save as PDF in the print window"
          };
    },
    rootTask() {
      return this.tasks.find((task) => !task.parentId) || this.tasks[0] || null;
    },
    rootTasks() {
      return this.rootTask ? [this.rootTask] : [];
    },
    flatTasks() {
      const rows = [];
      const walk = (task, depth) => {
        rows.push({ task, depth });
        this.childrenOf(task.id).forEach((child) => walk(child, depth + 1));
      };
      this.rootTasks.forEach((task) => walk(task, 0));
      return rows;
    },
    activeTask() {
      return this.tasks.find((task) => task.id === this.activeId) || this.tasks[0];
    },
    detailTask() {
      return this.tasks.find((task) => task.id === this.detailTaskId) || null;
    },
    detailPopoverStyle() {
      return {
        left: `${this.detailPopover.x}px`,
        top: `${this.detailPopover.y}px`
      };
    },
    focusTask() {
      return this.tasks.find((task) => task.id === (this.hoverId || this.activeId)) || this.activeTask;
    },
    focusChildren() {
      return this.focusTask ? this.childrenOf(this.focusTask.id) : [];
    },
    projectBounds() {
      const dates = this.tasks
        .flatMap((task) => [this.rangeFor(task).start, this.rangeFor(task).end])
        .filter(Boolean)
        .map((value) => new Date(`${value}T00:00:00`));
      if (!dates.length) {
        return {
          start: new Date("2026-06-09T00:00:00"),
          end: new Date("2026-06-16T00:00:00")
        };
      }
      const min = new Date(Math.min(...dates));
      const max = new Date(Math.max(...dates));
      min.setDate(min.getDate() - 1);
      max.setDate(max.getDate() + 1);
      return { start: min, end: max };
    },
    timelineBounds() {
      if (this.viewStart && this.viewEnd) {
        return {
          start: new Date(`${this.viewStart}T00:00:00`),
          end: new Date(`${this.viewEnd}T00:00:00`)
        };
      }
      return this.projectBounds;
    },
    overviewWindowStyle() {
      const projectStart = this.toDateInput(this.projectBounds.start);
      const projectEnd = this.toDateInput(this.projectBounds.end);
      const viewStart = this.toDateInput(this.timelineBounds.start);
      const viewEnd = this.toDateInput(this.timelineBounds.end);
      const totalDays = Math.max(1, this.dayDiff(projectStart, projectEnd) + 1);
      const leftDays = Math.max(0, this.dayDiff(projectStart, viewStart));
      const widthDays = Math.max(1, this.dayDiff(viewStart, viewEnd) + 1);
      return {
        left: `${(leftDays / totalDays) * 100}%`,
        width: `${Math.min(100, (widthDays / totalDays) * 100)}%`
      };
    },
    overviewStartHandleStyle() {
      return {
        left: this.overviewWindowStyle.left
      };
    },
    overviewEndHandleStyle() {
      return {
        left: `calc(${this.overviewWindowStyle.left} + ${this.overviewWindowStyle.width})`
      };
    },
    overviewRangeLabel() {
      return `${this.toDateInput(this.timelineBounds.start)} → ${this.toDateInput(this.timelineBounds.end)}`;
    },
    isFullTimelineView() {
      return this.toDateInput(this.timelineBounds.start) === this.toDateInput(this.projectBounds.start)
        && this.toDateInput(this.timelineBounds.end) === this.toDateInput(this.projectBounds.end);
    },
    overviewHintText() {
      return this.isFullTimelineView ? this.labels.overviewFullHint : this.labels.overviewHint;
    },
    timelineDays() {
      const days = [];
      const cursor = new Date(this.timelineBounds.start);
      const totalDays = Math.max(1, this.dayDiff(
        this.toDateInput(this.timelineBounds.start),
        this.toDateInput(this.timelineBounds.end)
      ) + 1);
      const step = totalDays > 150 ? 14 : totalDays > 90 ? 7 : totalDays > 45 ? 3 : 1;
      while (cursor <= this.timelineBounds.end) {
        days.push({
          key: this.toDateInput(cursor),
          label: `${cursor.getMonth() + 1}/${cursor.getDate()}`
        });
        cursor.setDate(cursor.getDate() + step);
      }
      const endKey = this.toDateInput(this.timelineBounds.end);
      if (days[days.length - 1]?.key !== endKey) {
        days.push({
          key: endKey,
          label: `${this.timelineBounds.end.getMonth() + 1}/${this.timelineBounds.end.getDate()}`
        });
      }
      return days;
    },
    timelineGridStyle() {
      return {
        "--day-count": this.timelineDays.length,
        "--timeline-width": `${Math.max(660, this.timelineDays.length * 40 + 24)}px`
      };
    },
    timelineRows() {
      const rows = [];
      const addChildren = (parentId, depth) => {
        const siblings = this.childrenOf(parentId);
        const lanes = new Map();
        siblings.forEach((task, index) => {
          const lane = this.laneFor(task, index);
          if (!lanes.has(lane)) lanes.set(lane, []);
          lanes.get(lane).push(task);
        });

        [...lanes.entries()]
          .sort(([left], [right]) => left - right)
          .forEach(([lane, tasks]) => {
            const ordered = [...tasks].sort((left, right) => String(this.rangeFor(left).start || "").localeCompare(String(this.rangeFor(right).start || "")));
            rows.push({
              key: `${parentId || "root"}-lane-${lane}`,
              parentId,
              lane,
              depth,
              tasks: ordered
            });
            ordered.forEach((task) => {
              if (this.isTimelineExpanded(task)) addChildren(task.id, depth + 1);
            });
          });
      };

      if (this.rootTask) {
        rows.push({
          key: "root-task",
          parentId: null,
          lane: 0,
          depth: 0,
          tasks: [this.rootTask]
        });
        if (this.isTimelineExpanded(this.rootTask)) addChildren(this.rootTask.id, 1);
      }
      return rows;
    },
    completedCount() {
      return this.tasks.filter((task) => task.done).length;
    },
    progressPercent() {
      return this.tasks.length ? Math.round((this.completedCount / this.tasks.length) * 100) : 0;
    },
    aiBreakdownRemaining() {
      return Math.max(0, this.aiBreakdownLimit - this.aiBreakdownUsed);
    },
    aiQuotaLabel() {
      return `${this.labels.aiQuota} ${this.aiBreakdownUsed}/${this.aiBreakdownLimit}`;
    },
    mindMapNodes() {
      return this.flatTasks.map(({ task, depth }, index) => ({
        task,
        depth,
        x: 54 + depth * 180,
        y: 54 + index * 68,
        width: task.id === this.activeId ? 156 : 138,
        height: 38
      }));
    },
    mindMapLinks() {
      return this.mindMapNodes
        .filter((node) => node.task.parentId)
        .map((node) => {
          const parent = this.mindMapNodes.find((item) => item.task.id === node.task.parentId);
          if (!parent) return null;
          return {
            key: `${parent.task.id}-${node.task.id}`,
            fromId: parent.task.id,
            toId: node.task.id,
            x1: parent.x + parent.width,
            y1: parent.y + parent.height / 2,
            x2: node.x,
            y2: node.y + node.height / 2
          };
        })
        .filter(Boolean);
    },
    mindMapViewBox() {
      const maxX = Math.max(...this.mindMapNodes.map((node) => node.x + node.width), 700) + 60;
      const maxY = Math.max(...this.mindMapNodes.map((node) => node.y + node.height), 420) + 60;
      return `0 0 ${maxX} ${maxY}`;
    }
  },
  methods: {
    childrenOf(id) {
      return this.tasks.filter((task) => task.parentId === id);
    },
    isDescendant(candidateId, parentId) {
      if (!candidateId || !parentId) return false;
      const childIds = this.childrenOf(parentId).map((task) => task.id);
      if (childIds.includes(candidateId)) return true;
      return childIds.some((id) => this.isDescendant(candidateId, id));
    },
    isParent(task) {
      return this.childrenOf(task.id).length > 0;
    },
    isRootTask(task) {
      return !!task && task.id === this.rootTask?.id;
    },
    canAddSibling(task) {
      return !!task?.parentId;
    },
    canPromote(task) {
      if (!task?.parentId) return false;
      const parent = this.tasks.find((item) => item.id === task.parentId);
      return !!parent?.parentId;
    },
    canDeleteTask(task) {
      return !!task && !this.isRootTask(task);
    },
    canDisplayAiSplit(task) {
      return !!task && (this.hoverId === task.id || this.activeId === task.id);
    },
    canRunAiSplit(task) {
      return !!task && !this.aiLoadingId && !this.childrenOf(task.id).length && this.aiBreakdownRemaining > 0;
    },
    aiSplitTitle(task) {
      if (this.aiLoadingId === task?.id) return this.labels.aiLoading;
      if (!task) return "";
      if (this.childrenOf(task.id).length) return this.labels.aiNodeHasChildren;
      if (!this.aiBreakdownRemaining) return this.labels.aiUsedUp;
      return `${this.labels.aiSplit} · ${this.aiQuotaLabel}`;
    },
    parentChoicesFor(task) {
      return this.tasks.filter((item) => item.id !== task?.id && !this.isDescendant(item.id, task?.id));
    },
    taskBarAriaLabel(task) {
      return `${this.labels.taskBarDragLabel}：${task.title}`;
    },
    selectTask(id) {
      this.activeId = id;
    },
    openTimelineEditor(task, event) {
      if (!task) return;
      this.activeId = task.id;
      this.detailTaskId = task.id;
      const panel = event?.currentTarget?.closest?.(".task-map-panel--gantt");
      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        const rowRect = event.currentTarget.getBoundingClientRect();
        const x = Math.min(
          Math.max(rowRect.left - panelRect.left + 18, 18),
          Math.max(18, panelRect.width - 360)
        );
        const y = Math.min(
          Math.max(rowRect.top - panelRect.top + 34, 72),
          Math.max(72, panelRect.height - 420)
        );
        this.detailPopover = { x, y };
      }
    },
    closeTimelineEditor() {
      this.detailTaskId = "";
    },
    async generateAiForTask(task) {
      if (!task) return;
      this.activeId = task.id;
      await this.generateAiStructure(task);
    },
    createBlankRootTask() {
      const start = this.toDateInput(new Date());
      const end = this.addDays(start, 6);
      return {
        id: `task-root-${Date.now()}`,
        parentId: null,
        title: this.labels.scratchRootTitle,
        note: this.labels.scratchRootNote,
        mode: "locked",
        start,
        end,
        ddl: `${end}T18:00`,
        done: false,
        timelineLane: 0
      };
    },
    clearCaseData() {
      this.removeTimelineListeners();
      const root = this.createBlankRootTask();
      this.tasks = [root];
      this.activeId = root.id;
      this.hoverId = "";
      this.draggingMapId = "";
      this.dropTargetId = "";
      this.timelineDrag = null;
      this.overviewDrag = null;
      this.viewStart = "";
      this.viewEnd = "";
      this.timelineExpandedIds = [root.id];
      this.isTimelineFullscreen = false;
      this.detailTaskId = "";
      this.aiPrompt = "";
      this.aiMessage = "";
      this.aiLoadingId = "";
      this.exportMessage = this.labels.clearCaseMessage;
    },
    focusWorkspace() {
      this.$nextTick(() => {
        const workspace = this.$el.querySelector(".task-map-workspace");
        if (workspace) workspace.focus({ preventScroll: true });
      });
    },
    createTask(parentId = null, afterId = "") {
      if (!parentId && this.rootTask) {
        parentId = this.rootTask.id;
      }
      const id = `task-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const task = {
        id,
        parentId,
        title: this.lang === "zh" ? "新的任务节点" : "New task node",
        note: "",
        mode: "auto",
        start: "",
        end: "",
        ddl: "",
        done: false,
        timelineLane: parentId
          ? Math.max(-1, ...this.childrenOf(parentId).map((item, index) => this.laneFor(item, index))) + 1
          : 0
      };
      if (!afterId) {
        this.tasks.push(task);
      } else {
        const index = this.tasks.findIndex((item) => item.id === afterId);
        this.tasks.splice(index + 1, 0, task);
      }
      this.activeId = id;
      this.$nextTick(() => {
        const input = this.$el.querySelector(`[data-task-input="${id}"]`);
        if (input) input.focus();
      });
    },
    addRoot() {
      if (this.rootTask) {
        this.activeId = this.rootTask.id;
        this.aiMessage = this.labels.rootLocked;
        return;
      }
      this.createTask(null);
    },
    addChild() {
      if (!this.activeTask) return;
      this.createTask(this.activeTask.id);
    },
    addChildFor(task) {
      this.activeId = task.id;
      this.createTask(task.id);
    },
    addSibling() {
      if (!this.activeTask) return;
      if (!this.activeTask.parentId) {
        this.createTask(this.activeTask.id);
        this.aiMessage = this.labels.rootLocked;
        return;
      }
      this.createTask(this.activeTask.parentId, this.activeTask.id);
    },
    addSiblingFor(task) {
      this.activeId = task.id;
      if (!task.parentId) {
        this.createTask(task.id);
        this.aiMessage = this.labels.rootLocked;
        return;
      }
      this.createTask(task.parentId, task.id);
    },
    handleTitleKeydown(event, task) {
      if (event.key === "Enter") {
        event.preventDefault();
        this.activeId = task.id;
        this.addSibling();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        this.activeId = task.id;
        if (event.shiftKey) this.promoteTask(task);
        else this.addChildFor(task);
      }
    },
    handleWorkspaceKeydown(event) {
      const tag = event.target?.tagName;
      const isTyping = ["TEXTAREA", "SELECT"].includes(tag);
      const isTitleInput = event.target?.classList?.contains("task-inspector__title");
      if (event.key === "Escape" && this.detailTask) {
        event.preventDefault();
        this.closeTimelineEditor();
        return;
      }
      if (event.key === "Escape" && this.isTimelineFullscreen) {
        event.preventDefault();
        this.exitTimelineFullscreen();
        return;
      }
      if (isTyping || (tag === "INPUT" && !isTitleInput)) return;
      if (!this.activeTask) return;

      if (event.key === "Enter") {
        event.preventDefault();
        this.addSiblingFor(this.activeTask);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) this.promoteTask(this.activeTask);
        else this.addChildFor(this.activeTask);
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !isTitleInput) {
        event.preventDefault();
        this.deleteTask(this.activeTask);
      }
    },
    promoteTask(task) {
      if (!this.canPromote(task)) return;
      const parent = this.tasks.find((item) => item.id === task.parentId);
      task.parentId = parent?.parentId || null;
      this.activeId = task.id;
    },
    setHoverTask(id) {
      this.hoverId = id || "";
    },
    isTaskInHoverPath(taskId) {
      if (!this.hoverId) return false;
      if (taskId === this.hoverId) return true;
      const hoverTask = this.tasks.find((task) => task.id === this.hoverId);
      return hoverTask?.parentId === taskId || this.childrenOf(this.hoverId).some((task) => task.id === taskId);
    },
    isFocusChild(taskId) {
      const sourceId = this.hoverId || this.activeId;
      if (!sourceId) return false;
      return this.childrenOf(sourceId).some((task) => task.id === taskId);
    },
    isLinkInHoverPath(link) {
      if (!this.hoverId) return false;
      return link.fromId === this.hoverId || link.toId === this.hoverId;
    },
    setParent(value) {
      if (!this.activeTask) return;
      if (this.isRootTask(this.activeTask)) {
        this.activeTask.parentId = null;
        return;
      }
      this.activeTask.parentId = value || this.rootTask?.id || null;
    },
    toggleDone(task) {
      task.done = !task.done;
    },
    descendantIds(id) {
      const ids = [];
      const collect = (parentId) => {
        this.childrenOf(parentId).forEach((child) => {
          ids.push(child.id);
          collect(child.id);
        });
      };
      collect(id);
      return ids;
    },
    deleteTask(task) {
      if (!this.canDeleteTask(task)) {
        this.aiMessage = this.labels.rootProtected;
        return;
      }
      const ids = [task.id, ...this.descendantIds(task.id)];
      this.tasks = this.tasks.filter((item) => !ids.includes(item.id));
      if (!this.tasks.length) {
        this.addRoot();
        return;
      }
      if (ids.includes(this.activeId)) this.activeId = this.tasks[0].id;
      if (ids.includes(this.hoverId)) this.hoverId = "";
      if (ids.includes(this.detailTaskId)) this.closeTimelineEditor();
      this.timelineExpandedIds = this.timelineExpandedIds.filter((id) => !ids.includes(id));
    },
    parentPathFor(task) {
      const path = [];
      let cursor = task;
      while (cursor) {
        path.unshift(cursor.title);
        cursor = this.tasks.find((item) => item.id === cursor.parentId);
      }
      return path;
    },
    siblingTitlesFor(task) {
      if (!task) return [];
      return this.tasks
        .filter((item) => item.parentId === task.parentId && item.id !== task.id)
        .map((item) => item.title);
    },
    async generateAiStructure(task = this.activeTask) {
      const parent = task || this.activeTask || this.tasks[0];
      if (!parent) return;
      this.activeId = parent.id;

      if (this.childrenOf(parent.id).length) {
        this.aiMessage = this.labels.aiNodeHasChildren;
        return;
      }

      if (!this.aiBreakdownRemaining) {
        this.aiMessage = this.labels.aiUsedUp;
        return;
      }

      this.aiLoadingId = parent.id;
      this.aiMessage = this.labels.aiLoading;

      try {
        const response = await fetch(`${this.apiBase}/api/task-map/breakdown`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            currentTask: {
              id: parent.id,
              title: parent.title,
              note: parent.note
            },
            parentPath: this.parentPathFor(parent),
            siblingTitles: this.siblingTitlesFor(parent),
            existingChildren: this.childrenOf(parent.id),
            lang: this.lang,
            maxChildren: 5,
            userPrompt: this.aiPrompt
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok || !Array.isArray(data.tasks)) {
          throw new Error(data.message || this.labels.aiUnavailable);
        }

        const parentRange = this.rangeFor(parent);
        const timestamp = Date.now();
        const generatedTasks = data.tasks.slice(0, 6).map((item, index) => ({
          id: `task-ai-${timestamp}-${index}`,
          parentId: parent.id,
          title: item.title || (this.lang === "zh" ? "新的子任务" : "New child task"),
          note: item.note || "",
          mode: parent.mode,
          start: parentRange.start || parent.start || "",
          end: parentRange.end || parent.end || "",
          ddl: parent.ddl || "",
          done: false,
          timelineLane: this.childrenOf(parent.id).length + index
        }));

        this.tasks.push(...generatedTasks);
        this.aiBreakdownUsed += 1;
        this.activeId = parent.id;
        this.aiMessage = data.fallback ? this.labels.aiFallbackMessage : this.labels.aiMessage;
      } catch (error) {
        this.aiMessage = error?.message || this.labels.aiUnavailable;
      } finally {
        this.aiLoadingId = "";
      }
    },
    shortTitle(value) {
      const source = value || "";
      return source.length > 12 ? `${source.slice(0, 12)}…` : source;
    },
    addDays(value, days) {
      const date = new Date(`${value}T00:00:00`);
      date.setDate(date.getDate() + days);
      return this.toDateInput(date);
    },
    toDateInput(date) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    rangeFor(task) {
      if (!task) return { start: "", end: "" };
      const children = this.childrenOf(task.id);
      if (task.mode === "locked" || !children.length) {
        return { start: task.start, end: task.end };
      }
      const starts = children.map((child) => this.rangeFor(child).start).filter(Boolean).sort();
      const ends = children.map((child) => this.rangeFor(child).end).filter(Boolean).sort();
      return {
        start: starts[0] || task.start,
        end: ends[ends.length - 1] || task.end
      };
    },
    displayRange(task) {
      const range = this.rangeFor(task);
      if (!range.start && !range.end) return "no date";
      return `${range.start || "?"} → ${range.end || "?"}`;
    },
    taskConflict(task) {
      if (!task.parentId) return false;
      const parent = this.tasks.find((item) => item.id === task.parentId);
      if (!parent || parent.mode !== "locked") return false;
      const range = this.rangeFor(task);
      const parentRange = this.rangeFor(parent);
      if (!range.start || !range.end || !parentRange.start || !parentRange.end) return false;
      return range.start < parentRange.start || range.end > parentRange.end;
    },
    dayDiff(from, to) {
      const start = new Date(`${from}T00:00:00`);
      const end = new Date(`${to}T00:00:00`);
      return Math.round((end - start) / 86400000);
    },
    barStyle(task) {
      const range = this.rangeFor(task);
      if (!range.start || !range.end) return { display: "none" };
      const startBound = this.toDateInput(this.timelineBounds.start);
      const endBound = this.toDateInput(this.timelineBounds.end);
      if (range.end < startBound || range.start > endBound) return { display: "none" };
      const visibleStart = range.start < startBound ? startBound : range.start;
      const visibleEnd = range.end > endBound ? endBound : range.end;
      const total = Math.max(1, this.dayDiff(startBound, endBound) + 1);
      const left = Math.max(0, this.dayDiff(startBound, visibleStart));
      const width = Math.max(1, this.dayDiff(visibleStart, visibleEnd) + 1);
      return {
        left: `${(left / total) * 100}%`,
        width: `${(width / total) * 100}%`
      };
    },
    startOverviewDrag(event, mode) {
      if (mode === "move" && this.isFullTimelineView) return;
      const rail = event.currentTarget.closest(".task-overview__rail");
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const projectStart = this.toDateInput(this.projectBounds.start);
      const projectEnd = this.toDateInput(this.projectBounds.end);
      const viewStart = this.toDateInput(this.timelineBounds.start);
      const viewEnd = this.toDateInput(this.timelineBounds.end);
      this.overviewDrag = {
        mode,
        startX: event.clientX,
        railWidth: Math.max(1, rect.width),
        projectStart,
        totalDays: Math.max(1, this.dayDiff(projectStart, projectEnd) + 1),
        startOffset: this.dayDiff(projectStart, viewStart),
        endOffset: this.dayDiff(projectStart, viewEnd)
      };
      window.addEventListener("mousemove", this.handleOverviewMove);
      window.addEventListener("mouseup", this.finishOverviewDrag);
      event.preventDefault();
    },
    handleOverviewMove(event) {
      if (!this.overviewDrag) return;
      const drag = this.overviewDrag;
      const delta = Math.round(((event.clientX - drag.startX) / drag.railWidth) * drag.totalDays);
      const maxOffset = drag.totalDays - 1;
      const minDays = Math.min(14, drag.totalDays);
      let startOffset = drag.startOffset;
      let endOffset = drag.endOffset;

      if (drag.mode === "start") {
        startOffset = Math.min(Math.max(0, drag.startOffset + delta), endOffset - minDays + 1);
      } else if (drag.mode === "end") {
        endOffset = Math.max(Math.min(maxOffset, drag.endOffset + delta), startOffset + minDays - 1);
      } else {
        const span = endOffset - startOffset;
        startOffset = Math.min(Math.max(0, drag.startOffset + delta), maxOffset - span);
        endOffset = startOffset + span;
      }

      this.viewStart = this.addDays(drag.projectStart, startOffset);
      this.viewEnd = this.addDays(drag.projectStart, endOffset);
    },
    finishOverviewDrag() {
      window.removeEventListener("mousemove", this.handleOverviewMove);
      window.removeEventListener("mouseup", this.finishOverviewDrag);
      this.overviewDrag = null;
    },
    fitTimeline() {
      this.viewStart = "";
      this.viewEnd = "";
    },
    startMindDrag(event, task) {
      this.draggingMapId = task.id;
      this.dropTargetId = "";
      this.setHoverTask(task.id);
      event.preventDefault();
    },
    setMindDropTarget(task) {
      if (!this.draggingMapId || task.id === this.draggingMapId || this.isDescendant(task.id, this.draggingMapId)) {
        this.dropTargetId = "";
        return;
      }
      this.dropTargetId = task.id;
    },
    finishMindDrag(task) {
      if (!this.draggingMapId) return;
      const dragged = this.tasks.find((item) => item.id === this.draggingMapId);
      const targetId = this.dropTargetId || task?.id || "";
      if (dragged && this.isRootTask(dragged)) {
        this.draggingMapId = "";
        this.dropTargetId = "";
        return;
      }
      if (dragged && targetId && targetId !== dragged.id && !this.isDescendant(targetId, dragged.id)) {
        dragged.parentId = targetId;
        this.activeId = dragged.id;
      }
      this.draggingMapId = "";
      this.dropTargetId = "";
    },
    cancelMindDrag() {
      this.draggingMapId = "";
      this.dropTargetId = "";
    },
    isMindDropTarget(taskId) {
      return this.dropTargetId === taskId;
    },
    laneFor(task, fallback = 0) {
      return Number.isFinite(task?.timelineLane) ? task.timelineLane : fallback;
    },
    isTimelineExpanded(task) {
      return !!task && this.timelineExpandedIds.includes(task.id);
    },
    toggleTimelineTask(task) {
      if (!task) return;
      this.activeId = task.id;
      if (!this.childrenOf(task.id).length) return;
      if (this.isTimelineExpanded(task)) {
        this.timelineExpandedIds = this.timelineExpandedIds.filter((id) => id !== task.id);
      } else {
        this.timelineExpandedIds = [...new Set([...this.timelineExpandedIds, task.id])];
      }
    },
    expandAllTimeline() {
      this.timelineExpandedIds = this.tasks.filter((task) => this.childrenOf(task.id).length).map((task) => task.id);
    },
    collapseTimeline() {
      this.timelineExpandedIds = this.rootTask ? [this.rootTask.id] : [];
    },
    taskBarSpan(task) {
      const range = this.rangeFor(task);
      if (!range.start || !range.end) return 0;
      return this.dayDiff(range.start, range.end) + 1;
    },
    canMoveTaskBar(task) {
      return this.taskBarSpan(task) >= 4;
    },
    dependencyStyle(before, after) {
      const startBound = this.toDateInput(this.timelineBounds.start);
      const endBound = this.toDateInput(this.timelineBounds.end);
      const beforeRange = this.rangeFor(before);
      const afterRange = this.rangeFor(after);
      if (!beforeRange.end || !afterRange.start || afterRange.start < beforeRange.end) return { display: "none" };
      const total = Math.max(1, this.dayDiff(startBound, endBound) + 1);
      const left = this.dayDiff(startBound, beforeRange.end) + 1;
      const width = this.dayDiff(beforeRange.end, afterRange.start);
      if (left < 0 || width < 1 || left + width > total) return { display: "none" };
      return {
        left: `${(left / total) * 100}%`,
        width: `${(width / total) * 100}%`
      };
    },
    startTimelineDrag(event, task, mode = "move") {
      if (mode === "move" && !this.canMoveTaskBar(task)) return;
      if (!task.start || !task.end) {
        const range = this.rangeFor(task);
        task.start = range.start || this.toDateInput(this.timelineBounds.start);
        task.end = range.end || this.addDays(task.start, 1);
      }
      this.timelineDrag = {
        id: task.id,
        mode,
        duration: Math.max(0, this.dayDiff(task.start, task.end))
      };
      window.addEventListener("mousemove", this.handleTimelineMove);
      window.addEventListener("mouseup", this.finishTimelineDrag);
      event.preventDefault();
    },
    handleTimelineMove(event) {
      if (!this.timelineDrag) return;
      const task = this.tasks.find((item) => item.id === this.timelineDrag.id);
      if (!task) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const track = target?.closest?.(".task-timeline__track") || document.querySelector(`[data-timeline-id="${task.id}"]`);
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const startBound = this.toDateInput(this.timelineBounds.start);
      const endBound = this.toDateInput(this.timelineBounds.end);
      const total = Math.max(1, this.dayDiff(startBound, endBound));
      const day = Math.round(percent * total);
      const date = this.addDays(startBound, day);
      if (this.timelineDrag.mode === "start") {
        task.start = date > task.end ? task.end : date;
      } else if (this.timelineDrag.mode === "end") {
        task.end = date < task.start ? task.start : date;
      } else {
        task.start = date;
        task.end = this.addDays(date, this.timelineDrag.duration);
        if (track.dataset.timelineParent === (task.parentId || "root")) {
          task.timelineLane = Number(track.dataset.timelineLane || 0);
        }
      }
    },
    finishTimelineDrag() {
      this.removeTimelineListeners();
      this.timelineDrag = null;
    },
    removeTimelineListeners() {
      window.removeEventListener("mousemove", this.handleTimelineMove);
      window.removeEventListener("mouseup", this.finishTimelineDrag);
      window.removeEventListener("mousemove", this.handleOverviewMove);
      window.removeEventListener("mouseup", this.finishOverviewDrag);
    },
    async toggleTimelineFullscreen() {
      const stage = this.$refs.timelineStage;
      if (!stage) return;
      if (this.isTimelineFullscreen) {
        await this.exitTimelineFullscreen();
        return;
      }
      this.expandAllTimeline();
      if (typeof stage.requestFullscreen !== "function") {
        this.isTimelineFullscreen = true;
        return;
      }
      try {
        await stage.requestFullscreen();
      } catch {
        this.isTimelineFullscreen = true;
      }
    },
    async exitTimelineFullscreen() {
      if (document.fullscreenElement === this.$refs.timelineStage && typeof document.exitFullscreen === "function") {
        await document.exitFullscreen();
      }
      this.isTimelineFullscreen = false;
    },
    handleFullscreenChange() {
      this.isTimelineFullscreen = document.fullscreenElement === this.$refs.timelineStage;
    },
    exportInteractiveHtml() {
      const labels = this.labels;
      const payload = JSON.stringify(this.tasks, null, 2);
      const html = `<!doctype html>
<html lang="${this.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Task Map Interactive Demo</title>
<style>
body{margin:0;background:#f5f5f2;color:#111;font-family:Arial,"Helvetica Neue",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:36px 20px 70px}
h1{font-size:clamp(34px,7vw,82px);line-height:.95;margin:0 0 18px}
p{line-height:1.7;color:#555}.bar{height:10px;background:#ddd;margin:24px 0}.bar span{display:block;height:100%;background:#111}
.task{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border-top:1px solid #ccc;padding:11px 0}
.task input[type=text]{width:100%;border:0;background:transparent;font:inherit}
.task button{border:1px solid #111;background:#fff;padding:7px 10px;cursor:pointer}
.done input[type=text]{text-decoration:line-through;color:#888}
.meta{font-family:monospace;font-size:12px;color:#777}.child{margin-left:28px}
</style>
</head>
<body>
<main class="wrap">
<h1>Task Map</h1>
<p>${labels.intro}</p>
<div class="bar"><span id="progress"></span></div>
<section id="app"></section>
</main>
<script>
const tasks=${payload};
const app=document.getElementById('app');
function childrenOf(id){return tasks.filter(task=>task.parentId===id)}
function render(){
  app.innerHTML='';
  const rows=[];
  function walk(task,depth){rows.push({task,depth});childrenOf(task.id).forEach(child=>walk(child,depth+1))}
  tasks.filter(task=>!task.parentId).forEach(task=>walk(task,0));
  rows.forEach(({task,depth})=>{
    const row=document.createElement('div');
    row.className='task '+(task.done?'done ':'')+(depth?'child':'');
    row.style.marginLeft=(depth*22)+'px';
    row.innerHTML='<button type="button">'+(task.done?'${labels.completed}':'${labels.complete}')+'</button><input type="text" value="'+task.title.replace(/"/g,'&quot;')+'"><span class="meta">'+(task.start||'?')+' → '+(task.end||'?')+'</span>';
    row.querySelector('button').onclick=()=>{task.done=!task.done;render()};
    row.querySelector('input').oninput=(event)=>{task.title=event.target.value};
    app.appendChild(row);
  });
  document.getElementById('progress').style.width=Math.round(tasks.filter(task=>task.done).length/tasks.length*100)+'%';
}
render();
</script>
</body>
</html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "task-map-interactive-demo.html";
      link.click();
      URL.revokeObjectURL(url);
      this.exportMessage = labels.exportReady;
    },
    exportPdf() {
      const labels = this.labels;
      const rows = this.flatTasks.map(({ task, depth }) => {
        const indent = depth * 18;
        return `<tr>
          <td style="padding-left:${indent}px">${task.done ? "✓" : "○"} ${task.title}</td>
          <td>${this.displayRange(task)}</td>
          <td>${task.mode === "locked" ? labels.locked : labels.auto}</td>
        </tr>`;
      }).join("");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Task Map PDF</title>
        <style>
          body{font-family:Arial,"Helvetica Neue",sans-serif;padding:34px;color:#111}
          h1{font-size:42px;margin:0 0 12px}
          p{line-height:1.7;color:#555}
          table{width:100%;border-collapse:collapse;margin-top:28px}
          th,td{border-top:1px solid #bbb;padding:12px 8px;text-align:left;vertical-align:top}
          th{font-family:monospace;font-size:12px;text-transform:uppercase;color:#666}
        </style>
      </head><body>
        <h1>Task Map Prototype</h1>
        <p>${labels.intro}</p>
        <table>
          <thead><tr><th>Task</th><th>Range</th><th>Mode</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload=()=>window.print();</script>
      </body></html>`);
      win.document.close();
      this.exportMessage = labels.printHint;
    }
  },
  template: `
    <section class="task-map-demo task-map-workspace" aria-label="Task Map interactive demo" tabindex="0" @keydown="handleWorkspaceKeydown">
      <div class="task-map-demo__intro">
        <p class="task-map-demo__kicker">{{ labels.kicker }}</p>
        <h2>{{ labels.title }}</h2>
        <p>{{ labels.intro }}</p>
        <div class="task-map-demo__actions">
          <a v-if="productUrl" class="task-map-product-link" :href="productUrl" target="_blank" rel="noreferrer">
            {{ labels.fullProductReady }}
          </a>
          <button v-else type="button" class="task-map-product-link task-map-product-link--pending" disabled>
            {{ labels.fullProductPending }}
          </button>
          <button type="button" @click="exportInteractiveHtml">{{ labels.exportHtml }}</button>
          <button type="button" @click="exportPdf">{{ labels.exportPdf }}</button>
          <button type="button" @click="clearCaseData">{{ labels.clearCaseData }}</button>
          <span v-if="exportMessage">{{ exportMessage }}</span>
        </div>
        <div class="task-map-demo__status" aria-label="Task Map demo status">
          <span>
            <strong>{{ labels.demoMode }}</strong>
            {{ labels.demoScope }}
          </span>
          <span>
            <strong>{{ labels.repoMode }}</strong>
            {{ labels.repoScope }}
          </span>
          <span>
            <strong>{{ labels.freezeMode }}</strong>
            {{ labels.freezeScope }}
          </span>
        </div>
      </div>

      <section class="task-ai-panel task-ai-panel--wide">
        <div>
          <span>{{ labels.aiTitle }}</span>
          <p>{{ labels.hierarchyHint }}</p>
        </div>
        <textarea v-model="aiPrompt" :placeholder="labels.aiPlaceholder" rows="2"></textarea>
        <div class="task-ai-panel__controls">
          <button type="button" :disabled="!canRunAiSplit(activeTask)" :title="aiSplitTitle(activeTask)" @click="generateAiStructure(activeTask)">
            {{ aiLoadingId === activeTask?.id ? labels.aiLoading : labels.aiGenerate }}
          </button>
          <span>{{ aiQuotaLabel }} · {{ completedCount }} / {{ tasks.length }} {{ labels.completed }}</span>
        </div>
        <p v-if="aiMessage" class="task-ai-panel__message">{{ aiMessage }}</p>
      </section>

      <div class="task-map-shell task-map-shell--diagram">
        <section class="task-map-panel task-map-panel--map">
          <header class="task-map-panel__header">
            <div>
              <span>01</span>
              <h3>{{ labels.mindMap }}</h3>
            </div>
          </header>

          <div class="mind-map-canvas">
            <p>{{ labels.canvasHint }}</p>
            <svg :viewBox="mindMapViewBox" role="img" aria-label="Mind map canvas" @mouseup="finishMindDrag()" @mouseleave="cancelMindDrag">
              <path
                v-for="link in mindMapLinks"
                :key="link.key"
                class="mind-map-link"
                :class="{ active: isLinkInHoverPath(link) }"
                :d="'M ' + link.x1 + ' ' + link.y1 + ' C ' + (link.x1 + 58) + ' ' + link.y1 + ', ' + (link.x2 - 58) + ' ' + link.y2 + ', ' + link.x2 + ' ' + link.y2"
              />
              <g
                v-for="node in mindMapNodes"
                :key="node.task.id"
                class="mind-map-node"
                :class="{ active: activeId === node.task.id, done: node.task.done, conflict: taskConflict(node.task), 'hover-related': isTaskInHoverPath(node.task.id), dragging: draggingMapId === node.task.id, 'drop-target': isMindDropTarget(node.task.id) }"
                :transform="'translate(' + node.x + ' ' + node.y + ')'"
                @click="selectTask(node.task.id); focusWorkspace()"
                @mousedown.stop="startMindDrag($event, node.task)"
                @mouseenter="setHoverTask(node.task.id)"
                @mousemove="setMindDropTarget(node.task)"
                @mouseup.stop="finishMindDrag(node.task)"
                @mouseleave="setHoverTask('')"
              >
                <title>{{ node.task.note || node.task.title }}</title>
                <rect :width="node.width" :height="node.height" />
                <text x="12" y="24">{{ shortTitle(node.task.title) }}</text>
                <foreignObject v-if="canDisplayAiSplit(node.task)" :x="node.width + 8" y="4" width="92" height="30">
                  <button
                    type="button"
                    class="mind-map-ai-button"
                    :disabled="!canRunAiSplit(node.task)"
                    :title="aiSplitTitle(node.task)"
                    @mousedown.stop
                    @click.stop="generateAiForTask(node.task)"
                  >
                    {{ aiLoadingId === node.task.id ? '...' : labels.aiSplit }}
                  </button>
                </foreignObject>
              </g>
            </svg>
            <div class="task-child-preview">
              <span>{{ labels.childPreview }} · {{ focusTask?.title }}</span>
              <div v-if="focusTask" class="task-child-preview__actions">
                <button type="button" @click="addChildFor(focusTask)">
                  + {{ labels.addChild }}
                  <kbd class="task-shortcut">Tab</kbd>
                </button>
                <button type="button" :disabled="!canAddSibling(focusTask)" @click="addSiblingFor(focusTask)">
                  + {{ labels.addSibling }}
                  <kbd class="task-shortcut">Enter</kbd>
                </button>
                <button type="button" :disabled="!canPromote(focusTask)" @click="promoteTask(focusTask)">
                  ← {{ labels.promoteInline }}
                  <kbd class="task-shortcut">Shift Tab</kbd>
                </button>
                <button type="button" :disabled="!canDeleteTask(focusTask)" @click="deleteTask(focusTask)">
                  × {{ labels.deleteTask }}
                  <kbd class="task-shortcut">Del</kbd>
                </button>
              </div>
              <div v-if="focusChildren.length">
                <button
                  v-for="child in focusChildren"
                  :key="child.id"
                  type="button"
                  @click="selectTask(child.id); focusWorkspace()"
                  @mouseenter="setHoverTask(child.id)"
                  @mouseleave="setHoverTask('')"
                >{{ child.title }}</button>
              </div>
              <p v-else>{{ labels.noChildPreview }}</p>
            </div>
          </div>
        </section>

        <section ref="timelineStage" class="task-map-panel task-map-panel--gantt" :class="{ 'is-fullscreen': isTimelineFullscreen }">
          <header class="task-map-panel__header">
            <div>
              <span>02</span>
              <h3>{{ labels.schedule }}</h3>
            </div>
            <div class="task-map-timeline-actions">
              <button type="button" :title="labels.expandAll" @click="expandAllTimeline">{{ labels.expandAll }}</button>
              <button type="button" :title="labels.collapseAll" @click="collapseTimeline">{{ labels.collapseAll }}</button>
              <button type="button" :title="isTimelineFullscreen ? labels.exitFullscreen : labels.fullscreen" @click="toggleTimelineFullscreen">
                {{ isTimelineFullscreen ? labels.exitFullscreen : labels.fullscreen }}
              </button>
            </div>
          </header>
          <p class="task-gantt-hint">{{ labels.ganttHint }}</p>
          <p class="task-gantt-hint">{{ labels.trackHint }}</p>
          <p class="task-gantt-hint">{{ labels.doubleClickHint }} {{ labels.childPeekHint }}</p>
            <div class="task-overview" :aria-label="labels.timeOverview">
              <div class="task-overview__header">
                <span>{{ labels.timeOverview }}</span>
                <div class="task-overview__controls">
                  <strong>{{ overviewRangeLabel }}</strong>
                  <button type="button" @click="fitTimeline">{{ labels.fitTimeline }}</button>
                </div>
              </div>
              <div class="task-overview__rail">
                <button
                  type="button"
                  class="task-overview__window"
                  :style="overviewWindowStyle"
                  :aria-label="labels.overviewWindow"
                  :title="overviewHintText"
                  :disabled="isFullTimelineView"
                  @mousedown="startOverviewDrag($event, 'move')"
                >
                  <span>{{ overviewHintText }}</span>
                </button>
                <button
                  type="button"
                  class="task-overview__handle task-overview__handle--start"
                  :style="overviewStartHandleStyle"
                  :aria-label="labels.overviewStartHandle"
                  :title="labels.overviewStartHandle"
                  @mousedown="startOverviewDrag($event, 'start')"
                ></button>
                <button
                  type="button"
                  class="task-overview__handle task-overview__handle--end"
                  :style="overviewEndHandleStyle"
                  :aria-label="labels.overviewEndHandle"
                  :title="labels.overviewEndHandle"
                  @mousedown="startOverviewDrag($event, 'end')"
                ></button>
              </div>
            </div>
            <div class="task-timeline" aria-label="Task timeline" @contextmenu.prevent="expandAllTimeline">
              <div class="task-timeline__dates" :style="timelineGridStyle">
                <span v-for="day in timelineDays" :key="day.key">{{ day.label }}</span>
              </div>
              <div
                v-for="row in timelineRows"
                :key="row.key"
                class="task-timeline__row"
                :class="{ 'has-active-task': row.tasks.some((task) => activeId === task.id) }"
                :style="{ ...timelineGridStyle, '--task-depth': row.depth }"
              >
                <div class="task-timeline__track" :data-timeline-id="row.key" :data-timeline-parent="row.parentId || 'root'" :data-timeline-lane="row.lane" :style="timelineGridStyle">
                  <span
                    v-for="(task, index) in row.tasks.slice(0, -1)"
                    :key="task.id + '-dependency'"
                    class="task-timeline__dependency"
                    :style="dependencyStyle(task, row.tasks[index + 1])"
                    aria-hidden="true"
                  ></span>
                  <div
                    v-for="task in row.tasks"
                    :key="task.id + '-bar'"
                    class="task-timeline__bar"
                    :class="{ active: activeId === task.id, done: task.done, conflict: taskConflict(task), narrow: !canMoveTaskBar(task) }"
                    :style="barStyle(task)"
                    :aria-label="taskBarAriaLabel(task)"
                    @mouseenter="setHoverTask(task.id)"
                    @mouseleave="setHoverTask('')"
                    @dblclick.stop="openTimelineEditor(task, $event)"
                  >
                    <button type="button" class="task-timeline__resize task-timeline__resize--start" :title="labels.resizeStart" :aria-label="labels.resizeStart" @mousedown.stop="startTimelineDrag($event, task, 'start')"></button>
                    <button
                      v-if="canMoveTaskBar(task)"
                      type="button"
                      class="task-timeline__bar-center"
                      :title="childrenOf(task.id).length ? (isTimelineExpanded(task) ? labels.collapseChildren : labels.expandChildren) : labels.moveTask"
                      @click.stop="toggleTimelineTask(task); focusWorkspace()"
                      @mousedown.stop="startTimelineDrag($event, task, 'move')"
                    ><span class="task-timeline__bar-title">{{ task.title }}</span></button>
                    <span v-else class="task-timeline__bar-title" @click.stop="toggleTimelineTask(task); focusWorkspace()">{{ task.title }}</span>
                    <button type="button" class="task-timeline__resize task-timeline__resize--end" :title="labels.resizeEnd" :aria-label="labels.resizeEnd" @mousedown.stop="startTimelineDrag($event, task, 'end')"></button>
                    <span v-if="childrenOf(task.id).length" class="task-bar-children" aria-hidden="true">
                      <span v-for="child in childrenOf(task.id)" :key="child.id">{{ child.title }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Transition name="task-detail-popover">
              <div v-if="detailTask" class="task-detail-popover task-inspector" :style="detailPopoverStyle">
                <header class="task-detail-popover__header">
                  <div>
                    <p class="task-inspector__label">{{ labels.selected }}</p>
                    <strong>{{ labels.openDetail }}</strong>
                  </div>
                  <button type="button" @click="closeTimelineEditor">{{ labels.closeDetail }}</button>
                </header>
                <input v-model="detailTask.title" class="task-inspector__title" @keydown="handleWorkspaceKeydown" />
                <label>
                  <span>{{ labels.parent }}</span>
                  <select
                    :value="detailTask.parentId || ''"
                    :disabled="isRootTask(detailTask)"
                    @change="activeId = detailTask.id; setParent($event.target.value)"
                  >
                    <option value="" :disabled="!isRootTask(detailTask)">{{ labels.noParent }}</option>
                    <option v-for="task in parentChoicesFor(detailTask)" :key="task.id" :value="task.id">{{ task.title }}</option>
                  </select>
                </label>
                <label>
                  <span>{{ labels.note }}</span>
                  <textarea v-model="detailTask.note" rows="3"></textarea>
                </label>
                <div class="task-time-details">
                  <p>{{ labels.ddlHint }}</p>
                  <label>
                    <span>{{ labels.ddl }}</span>
                    <input type="datetime-local" v-model="detailTask.ddl" />
                  </label>
                  <label>
                    <span>Range mode</span>
                    <select v-model="detailTask.mode">
                      <option value="auto">{{ labels.auto }}</option>
                      <option value="locked">{{ labels.locked }}</option>
                    </select>
                  </label>
                </div>
                <p v-if="taskConflict(detailTask)" class="task-warning">{{ labels.conflict }}</p>
              </div>
            </Transition>
        </section>
      </div>
    </section>
  `
};
