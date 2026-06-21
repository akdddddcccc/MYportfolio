export default {
  name: "AIWorkflowDemo",
  props: {
    lang: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      promptText: "",
      textLayerPrompt: this.lang === "zh"
        ? "参考上贴背景质感，保留原文案，只调整字体气质、颜色和局部强调方式。"
        : "Reference the top sticker texture, preserve the copy, and adjust only type tone, color, and emphasis.",
      copyText: this.lang === "zh"
        ? "例如：\n“NOBOOK · 618 狂欢季\n重走真理诞生路”"
        : "Example:\n“NOBOOK · 618 Campaign\nTrace the birth of truth”",
      statusText: this.lang === "zh" ? "等待输入" : "Waiting",
      runningStep: "",
      loadingTimer: null,
      loadingWordIndex: 0,
      apiBase: typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)
        ? "http://127.0.0.1:8787"
        : "",
      apiStatus: {
        checked: false,
        online: false,
        hasOpenAIKey: false,
        message: ""
      },
      referenceUrl: "",
      referenceDataUrl: "",
      referenceName: this.lang === "zh" ? "用于提取背景风格" : "For background style extraction",
      fontReferenceName: this.lang === "zh" ? "未上传字体参考图" : "No font reference uploaded",
      fontReferenceUrl: "",
      fontReferenceDataUrl: "",
      fontPresetReferenceDataUrls: {},
      fontPresetReferenceUrls: {
        clean: "/images/work/ai-workflow-font-presets/elegant-songti.png",
        expressive: "/images/work/ai-workflow-font-presets/expressive-calligraphy.png",
        rounded: "/images/work/ai-workflow-font-presets/rounded-cute.png"
      },
      liveRoomUrl: "",
      liveRoomDataUrl: "",
      liveRoomName: this.lang === "zh" ? "等待上传截图" : "Waiting for screenshot",
      liveRoomSize: {
        width: 1080,
        height: 1920
      },
      activeUploadTarget: "reference",
      activeFadeTarget: "top",
      activeFusionMode: "fade",
      previewPeekTarget: "",
      topPathPoints: [],
      bottomPathPoints: [],
      isDrawing: false,
      referenceObjectUrl: "",
      fontReferenceObjectUrl: "",
      liveRoomObjectUrl: "",
      textInteraction: null,
      textLayerVisible: true,
      selectedFontStyle: "clean",
      extractTextStyleFromReference: false,
      textLayerVerified: false,
      stickerOutputs: {
        top: "",
        side: "",
        bottom: ""
      },
      stickerOutputSizes: {
        top: { width: 1536, height: 1024 },
        side: { width: 1024, height: 1536 },
        bottom: { width: 1536, height: 1024 }
      },
      stickerPrompts: {
        top: "",
        side: "",
        bottom: ""
      },
      textLayerOutput: "",
      textLayerDraftOutput: "",
      textLayerPromptBuilt: "",
      compositionSize: {
        width: 1080,
        height: 1920,
        mobileWidth: 880
      },
      boardSize: {
        width: 1080,
        height: 1920
      },
      textLayer: {
        x: 0,
        y: 0,
        width: 720,
        height: 220
      },
      sideLayerVisible: false,
      sideInteraction: null,
      sideLayer: {
        x: 40,
        y: 780,
        width: 210,
        height: 315
      },
      assets: [
        { key: "text", title: this.lang === "zh" ? "文字图层" : "Text layer", copy: this.lang === "zh" ? "按当前缩放尺寸导出透明 PNG" : "Transparent PNG at current scaled size", ready: true },
        { key: "top", title: this.lang === "zh" ? "上贴背景" : "Top background", copy: this.lang === "zh" ? "1080 宽，带当前渐隐边缘" : "1080 wide with current fade edge", ready: true },
        { key: "side", title: this.lang === "zh" ? "侧贴背景" : "Side background", copy: this.lang === "zh" ? "按 210 宽置入尺寸导出" : "Exported at 210-wide placed size", ready: false },
        { key: "bottom", title: this.lang === "zh" ? "下贴背景" : "Bottom background", copy: this.lang === "zh" ? "1080 宽，带当前渐隐边缘" : "1080 wide with current fade edge", ready: false },
        { key: "composite", title: this.lang === "zh" ? "贴片效果图" : "Composite preview", copy: this.lang === "zh" ? "完整 1080x1920 覆盖效果图" : "Full 1080x1920 overlay render", ready: true }
      ]
    };
  },
  computed: {
    labels() {
      return {
        zh: {
          kicker: "interactive demo",
          title: "贴片生成测试台",
          intro: "按功能步骤重新排布：先生成三贴背景，再生成文字图层，最后上传直播间底图进行路径融合和批量导出。",
          stickerInput: "贴片 input",
          textInput: "文字层 input",
          fusionInput: "融合 input",
          prototypeInput: "原型输入",
          uploadReference: "上传参考图",
          referenceReady: "参考图已载入，可重新上传或粘贴替换",
          uploadOptional: "上传参考图（非必需）",
          uploadFontReference: "上传字体参考图（非必需）",
          uploadLiveRoom: "上传无贴片直播间截图",
          pasteHint: "支持Ctrl+V 粘贴图片",
          prompt: "描述引导（非必填）",
          promptPlaceholder: "可补充直播间调性、边缘渐隐、留白方式等要求；不填则直接按参考图和预设规则生成。",
          textContent: "文本内容",
          textReferenceTop: "文字颜色、材质和周围小装饰继承第一步生成的上贴背景；字体参考图只学习字形、笔势和字面质感，不学习背景、颜色和其他元素。",
          extractReferenceTextStyle: "从第一步参考图提取文字风格",
          extractReferenceTextStyleHint: "仅在参考图里有可用文字时打开；只学习字形气质，不复制文案、背景和颜色。",
          textNeedsTop: "请先完成第一步，生成上贴背景后再生成文字层。",
          fontReferenceReady: "字体参考图已载入，只作为字形和局部质感参考",
          whiteDraft: "白底字体稿",
          run: "执行当前步骤",
          running: "执行中...",
          output: "output",
          stickerOutput: "贴片输出",
          topBg: "上贴背景",
          sideBg: "侧贴",
          bottomBg: "下贴背景",
          topText: "上贴文字",
          cutout: "自动抠图（api 提供自）",
          transparentPng: "透明 png",
          stickerEffect: "贴片效果",
          liveRoomBase: "直播间底图",
          fadeBrush: "手绘渐隐",
          placeText: "置入文字框",
          textMoveHint: "方向键微调位置",
          placeSide: "置入侧贴",
          exportTitle: "图层清单 批量导出",
          exportAll: "批量导出",
          downloadOriginal: "下载原图",
          localDraft: "本地草稿",
          realGenerated: "真实生成",
          serviceOffline: "本地生成服务未启动",
          serviceNoKey: "本地服务已启动，未检测到 OPENAI_API_KEY",
          fontOne: "飘逸宋体",
          fontTwo: "书法张扬体",
          fontRounded: "圆润可爱体",
          fontReferenceMode: "字体参考",
          learnReference: "学习参考图",
          waitingUpload: "等待上传截图",
          manualCheckTitle: "文字核对",
          manualCheckBody: "生成图可能改字。请逐字对照目标文案，确认品牌名、数字、符号、换行和复杂汉字都正确后再进入融合。",
          expectedCopy: "目标文案",
          confirmTextAccurate: "已人工确认生成文字完全正确",
          textUnchecked: "未核对",
          textChecked: "已核对"
        },
        en: {
          kicker: "interactive demo",
          title: "Sticker generation test bench",
          intro: "Reordered by workflow: generate sticker backgrounds, create the text layer, then upload a live-room base for path blending and batch export.",
          stickerInput: "sticker input",
          textInput: "text layer input",
          fusionInput: "fusion input",
          prototypeInput: "Prototype input",
          uploadReference: "Upload reference",
          referenceReady: "Reference loaded. Upload or paste again to replace it.",
          uploadOptional: "Upload reference (optional)",
          uploadFontReference: "Upload font reference (optional)",
          uploadLiveRoom: "Upload live-room screenshot without stickers",
          pasteHint: "Supports Ctrl+V image paste",
          prompt: "Prompt guidance (optional)",
          promptPlaceholder: "Optionally add tone, edge fade, or spacing notes. Leave blank to use the reference image and default rules.",
          textContent: "Text content",
          textReferenceTop: "Typography color, material, and small surrounding accents inherit from the top sticker generated in step 1. The optional font reference only guides letter shape, stroke rhythm, and face texture.",
          extractReferenceTextStyle: "Extract text style from step-1 reference",
          extractReferenceTextStyleHint: "Enable only when the first reference contains useful lettering. It learns typography mood only, not copy, background, or color.",
          textNeedsTop: "Generate the top sticker in step 1 before creating the text layer.",
          fontReferenceReady: "Font reference loaded. It only guides letterform and local texture.",
          whiteDraft: "White draft",
          run: "Run current step",
          running: "Running...",
          output: "output",
          stickerOutput: "Sticker output",
          topBg: "Top background",
          sideBg: "Side",
          bottomBg: "Bottom background",
          topText: "Top text",
          cutout: "Auto cutout (API)",
          transparentPng: "Transparent png",
          stickerEffect: "Sticker effect",
          liveRoomBase: "Live-room base",
          fadeBrush: "Draw fade",
          placeText: "Place text box",
          textMoveHint: "Arrow keys move",
          placeSide: "Place side sticker",
          exportTitle: "Layer list Batch export",
          exportAll: "Batch export",
          downloadOriginal: "Download original",
          localDraft: "Local draft",
          realGenerated: "Generated",
          serviceOffline: "Local generation server is offline",
          serviceNoKey: "Local server is running without OPENAI_API_KEY",
          fontOne: "Thin serif",
          fontTwo: "Expressive script",
          fontRounded: "Rounded cute",
          fontReferenceMode: "Font reference",
          learnReference: "Learn reference",
          waitingUpload: "Waiting for screenshot",
          manualCheckTitle: "Text check",
          manualCheckBody: "Generated lettering can alter copy. Compare every character, number, symbol, line break, and complex glyph before fusion.",
          expectedCopy: "Expected copy",
          confirmTextAccurate: "I have manually confirmed the generated text is exact",
          textUnchecked: "Unchecked",
          textChecked: "Checked"
        }
      }[this.lang];
    },
    stepCards() {
      return [
        { key: "sticker-bg", index: "01", title: this.lang === "zh" ? "贴片背景" : "Sticker bg" },
        { key: "text-layer", index: "02", title: this.lang === "zh" ? "文字层" : "Text layer" },
        { key: "fusion", index: "03", title: this.lang === "zh" ? "融合素材" : "Fusion" },
        { key: "fusion", index: "04", title: this.lang === "zh" ? "导出" : "Export" }
      ];
    },
    topStickerHeight() {
      return this.scaledHeightForWidth(this.stickerOutputSizes.top, this.compositionSize.width);
    },
    bottomStickerHeight() {
      return this.scaledHeightForWidth(this.stickerOutputSizes.bottom, this.compositionSize.width);
    },
    bottomStickerY() {
      return this.compositionSize.height - this.bottomStickerHeight;
    },
    sideStickerWidth() {
      return this.sideLayer.width;
    },
    sideStickerHeight() {
      return this.scaledHeightForWidth(this.stickerOutputSizes.side, this.sideLayer.width);
    },
    stickerFadeBleed() {
      return 180;
    },
    topStickerRenderY() {
      return -this.stickerFadeBleed;
    },
    topStickerRenderHeight() {
      return this.topStickerHeight + this.stickerFadeBleed * 2;
    },
    bottomStickerRenderY() {
      return this.bottomStickerY - this.stickerFadeBleed;
    },
    bottomStickerRenderHeight() {
      return this.bottomStickerHeight + this.stickerFadeBleed * 2;
    },
    topPathD() {
      return this.pointsToPath(this.topPathPoints);
    },
    bottomPathD() {
      return this.pointsToPath(this.bottomPathPoints);
    },
    topMaskD() {
      const line = this.normalizedPath(this.topPathPoints, this.topStickerHeight * 0.72, "top");
      const reversed = [...line].reverse();
      const bleed = this.stickerFadeBleed;
      return [
        `M ${-bleed} ${-bleed}`,
        `L ${this.compositionSize.width + bleed} ${-bleed}`,
        `L ${this.compositionSize.width + bleed} ${Math.round(line[line.length - 1].y)}`,
        ...reversed.map((point) => `L ${Math.round(point.x)} ${Math.round(point.y)}`),
        `L ${-bleed} ${Math.round(line[0].y)}`,
        "Z"
      ].join(" ");
    },
    bottomMaskD() {
      const line = this.normalizedPath(this.bottomPathPoints, this.bottomStickerY + this.bottomStickerHeight * 0.28, "bottom");
      const bleed = this.stickerFadeBleed;
      return [
        `M ${-bleed} ${Math.round(line[0].y)}`,
        ...line.map((point) => `L ${Math.round(point.x)} ${Math.round(point.y)}`),
        `L ${this.compositionSize.width + bleed} ${Math.round(line[line.length - 1].y)}`,
        `L ${this.compositionSize.width + bleed} ${this.compositionSize.height + bleed}`,
        `L ${-bleed} ${this.compositionSize.height + bleed}`,
        "Z"
      ].join(" ");
    },
    textLayerDisplay() {
      return this.copyText.replace(/^Example:\n?|^例如：\n?/, "").replace(/[“”"]/g, "").trim();
    },
    expectedCopyLines() {
      const text = this.textLayerDisplay || (this.lang === "zh" ? "等待输入文案" : "Waiting for copy");
      return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    },
    textLayerStyle() {
      return {
        left: this.toPercentX(this.textLayer.x),
        top: this.toPercentY(this.textLayer.y),
        width: this.toPercentX(this.textLayer.width),
        height: this.toPercentY(this.textLayer.height)
      };
    },
    sideLayerStyle() {
      return {
        left: this.toPercentX(this.sideLayer.x),
        top: this.toPercentY(this.sideLayer.y),
        width: this.toPercentX(this.sideLayer.width),
        height: this.toPercentY(this.sideLayer.height)
      };
    },
    safeLineStyles() {
      const inset = (this.compositionSize.width - this.compositionSize.mobileWidth) / 2;
      return [
        { left: this.toPercentX(inset) },
        { left: this.toPercentX(this.compositionSize.width - inset) }
      ];
    },
    loadingWords() {
      if (this.lang === "zh") return ["等待中···", "生成中···", "读取中···"];
      return ["Waiting···", "Generating···", "Reading···"];
    },
    loadingMessage() {
      return this.loadingWords[this.loadingWordIndex % this.loadingWords.length];
    }
  },
  watch: {
    copyText() {
      this.textLayerVerified = false;
    },
    textLayerOutput() {
      this.textLayerVerified = false;
    }
  },
  mounted() {
    this.loadingTimer = window.setInterval(() => {
      this.loadingWordIndex += 1;
    }, 1100);
    this.resizeCompositionForDisplay();
    this.centerTextLayer();
    this.checkWorkflowServer();
    window.addEventListener("resize", this.resizeCompositionForDisplay);
    window.addEventListener("pointermove", this.moveOverlayInteraction);
    window.addEventListener("pointerup", this.endOverlayInteraction);
    window.addEventListener("paste", this.pasteImageToActiveUpload);
  },
  beforeUnmount() {
    window.clearInterval(this.loadingTimer);
    if (this.referenceObjectUrl) URL.revokeObjectURL(this.referenceObjectUrl);
    if (this.fontReferenceObjectUrl) URL.revokeObjectURL(this.fontReferenceObjectUrl);
    if (this.liveRoomObjectUrl) URL.revokeObjectURL(this.liveRoomObjectUrl);
    window.removeEventListener("resize", this.resizeCompositionForDisplay);
    window.removeEventListener("pointermove", this.moveOverlayInteraction);
    window.removeEventListener("pointerup", this.endOverlayInteraction);
    window.removeEventListener("paste", this.pasteImageToActiveUpload);
  },
  methods: {
    async checkWorkflowServer() {
      try {
        const response = await fetch(`${this.apiBase}/api/ai-workflow/status`);
        const data = await response.json();
        this.apiStatus = {
          checked: true,
          online: Boolean(data.ok),
          hasOpenAIKey: Boolean(data.hasOpenAIKey),
          message: data.hasOpenAIKey
            ? (this.lang === "zh" ? "本地生图服务已连接，可真实调用 API" : "Local generation server connected")
            : this.labels.serviceNoKey
        };
        this.statusText = this.apiStatus.message;
      } catch {
        this.apiStatus = {
          checked: true,
          online: false,
          hasOpenAIKey: false,
          message: this.labels.serviceOffline
        };
        this.statusText = this.labels.serviceOffline;
      }
    },
    async loadReference(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      this.setUploadTarget("reference");
      await this.setReferenceFile(file);
      event.target.value = "";
    },
    async pasteImageToActiveUpload(event) {
      const items = [...(event.clipboardData?.items || [])];
      const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      await this.setImageForTarget(this.activeUploadTarget || "reference", file, this.lang === "zh" ? "剪贴板图片" : "Clipboard image");
    },
    setUploadTarget(target) {
      this.activeUploadTarget = target;
      if (target === "font") this.selectedFontStyle = "reference";
    },
    async setImageForTarget(target, file, fallbackName = "") {
      if (target === "font") {
        await this.setFontReferenceFile(file, fallbackName);
        return;
      }
      if (target === "liveRoom") {
        await this.setLiveRoomFile(file, fallbackName);
        return;
      }
      await this.setReferenceFile(file, fallbackName);
    },
    async setReferenceFile(file, fallbackName = "") {
      if (this.referenceObjectUrl) URL.revokeObjectURL(this.referenceObjectUrl);
      this.referenceObjectUrl = URL.createObjectURL(file);
      this.referenceUrl = this.referenceObjectUrl;
      this.referenceDataUrl = await this.fileToDataUrl(file);
      this.referenceName = file.name || fallbackName;
      this.statusText = this.lang === "zh" ? "参考图已载入" : "Reference loaded";
    },
    async loadFontReference(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      this.setUploadTarget("font");
      await this.setFontReferenceFile(file);
      event.target.value = "";
    },
    async setFontReferenceFile(file, fallbackName = "") {
      if (this.fontReferenceObjectUrl) URL.revokeObjectURL(this.fontReferenceObjectUrl);
      this.fontReferenceObjectUrl = URL.createObjectURL(file);
      this.fontReferenceUrl = this.fontReferenceObjectUrl;
      this.fontReferenceName = file.name || fallbackName;
      this.fontReferenceDataUrl = await this.fileToDataUrl(file);
      this.statusText = this.lang === "zh" ? "字体参考图已载入" : "Font reference loaded";
    },
    async loadLiveRoom(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      this.setUploadTarget("liveRoom");
      await this.setLiveRoomFile(file);
      event.target.value = "";
    },
    async setLiveRoomFile(file, fallbackName = "") {
      if (this.liveRoomObjectUrl) URL.revokeObjectURL(this.liveRoomObjectUrl);
      this.liveRoomObjectUrl = URL.createObjectURL(file);
      this.liveRoomUrl = this.liveRoomObjectUrl;
      this.liveRoomDataUrl = await this.fileToDataUrl(file);
      this.liveRoomName = file.name || fallbackName;
      this.activeFusionMode = "fade";
      this.previewPeekTarget = "";
      const size = await this.readImageSize(this.liveRoomUrl).catch(() => this.compositionSize);
      this.liveRoomSize = size;
      const sizeText = `${size.width}x${size.height}`;
      const isExpectedSize = size.width === this.compositionSize.width && size.height === this.compositionSize.height;
      this.statusText = isExpectedSize
        ? (this.lang === "zh" ? `直播间底图已载入：${sizeText}，可以绘制融合路径` : `Live-room base loaded: ${sizeText}`)
        : (this.lang === "zh" ? `当前底图为 ${sizeText}，第三栏建议使用 1080x1920。` : `Current base is ${sizeText}. Use 1080x1920 for this workflow.`);
    },
    readImageSize(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Image size could not be read."));
        image.src = url;
      });
    },
    selectFontStyle(style) {
      this.selectedFontStyle = style;
      if (style === "reference") {
        this.setUploadTarget("font");
        return;
      }
      if (this.activeUploadTarget === "font") this.setUploadTarget("reference");
    },
    async fontReferenceImageForRun() {
      if (this.selectedFontStyle === "reference") return this.fontReferenceDataUrl;
      const presetUrl = this.fontPresetReferenceUrls[this.selectedFontStyle];
      if (!presetUrl) return "";
      if (!this.fontPresetReferenceDataUrls[presetUrl]) {
        this.fontPresetReferenceDataUrls[presetUrl] = await this.imageUrlToDataUrl(presetUrl);
      }
      return this.fontPresetReferenceDataUrls[presetUrl];
    },
    fontPresetKeyForRun() {
      const keys = {
        clean: "elegant-songti",
        expressive: "expressive-calligraphy",
        rounded: "rounded-cute"
      };
      return keys[this.selectedFontStyle] || "";
    },
    async imageUrlToDataUrl(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Font preset image not found: ${url}`);
      const blob = await response.blob();
      return this.fileToDataUrl(blob);
    },
    fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    async postWorkflow(path, payload) {
      const response = await fetch(`${this.apiBase}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        const isHtml = responseText.trim().startsWith("<");
        const statusHint = response.status === 504
          ? (this.lang === "zh" ? "云函数执行超时，请稍后重试或拆分生成。" : "Cloud function timed out. Try again later or split the generation.")
          : "";
        throw new Error([
          statusHint || (this.lang === "zh" ? `接口返回了非 JSON 内容（HTTP ${response.status}）。` : `The API returned non-JSON content (HTTP ${response.status}).`),
          isHtml && this.lang === "zh" ? "这通常表示 EdgeOne 返回了错误页，而不是工作流接口结果。" : "",
          isHtml && this.lang !== "zh" ? "This usually means EdgeOne returned an error page instead of a workflow result." : ""
        ].filter(Boolean).join(" "));
      }
      if (!response.ok) {
        throw new Error(data.message || "Workflow request failed");
      }
      return data;
    },
    async runStickerBackgrounds() {
      this.setUploadTarget("reference");
      if (!this.referenceDataUrl) {
        this.statusText = this.lang === "zh"
          ? "请先在第一栏上传或粘贴参考图。"
          : "Upload or paste a reference image in step 1 first.";
        return;
      }
      this.runningStep = "sticker-bg";
      this.statusText = this.lang === "zh"
        ? "正在按套组顺序生成上贴、侧贴、下贴，每张会单独请求以避免云端超时..."
        : "Generating the sticker set one by one to avoid cloud timeouts...";
      try {
        const kinds = ["top", "side", "bottom"];
        const kindLabels = {
          top: this.lang === "zh" ? "上贴" : "top sticker",
          side: this.lang === "zh" ? "侧贴" : "side sticker",
          bottom: this.lang === "zh" ? "下贴" : "bottom sticker"
        };
        const allErrors = {};
        const allWarnings = {};
        let allGenerated = true;

        for (let index = 0; index < kinds.length; index += 1) {
          const kind = kinds[index];
          this.statusText = this.lang === "zh"
            ? `正在生成${kindLabels[kind]}（${index + 1}/3），保持同一参考图和套系规则...`
            : `Generating ${kindLabels[kind]} (${index + 1}/3) with the same reference and series rules...`;
          try {
            const data = await this.postWorkflow("/api/ai-workflow/sticker-backgrounds", {
              lang: this.lang,
              kind,
              promptText: this.promptText,
              referenceImage: this.referenceDataUrl
            });
            this.stickerOutputs = {
              ...this.stickerOutputs,
              [kind]: data.assets?.[kind] || ""
            };
            this.stickerPrompts = {
              ...this.stickerPrompts,
              [kind]: data.prompts?.[kind] || ""
            };
            if (!data.generated) allGenerated = false;
            if (data.errors?.[kind]) allErrors[kind] = data.errors[kind];
            if (data.warnings?.[kind]) allWarnings[kind] = data.warnings[kind];
          } catch (error) {
            allGenerated = false;
            allErrors[kind] = error.message || "Image request failed";
            this.statusText = this.lang === "zh"
              ? `${kindLabels[kind]}生成失败，继续尝试下一张...`
              : `${kindLabels[kind]} failed. Continuing with the next sticker...`;
          }
        }

        this.assets[1].ready = true;
        this.assets[2].ready = true;
        this.assets[3].ready = true;
        const errorText = Object.keys(allErrors).length
          ? Object.entries(allErrors).map(([key, value]) => `${key}: ${value}`).join(" / ")
          : "";
        const warningText = Object.keys(allWarnings).length
          ? Object.values(allWarnings).join(" / ")
          : "";
        this.statusText = allGenerated
          ? [
            this.lang === "zh" ? "上贴、侧贴、下贴已真实生成" : "Sticker backgrounds generated",
            warningText
          ].filter(Boolean).join(" / ")
          : [
            this.lang === "zh" ? "部分贴片已回退成本地草稿。" : "Some stickers fell back to local drafts.",
            warningText,
            errorText,
            errorText && this.lang === "zh" ? "如果连续出现超时、余额不足、rate limit 或 quota，通常就是网关额度/限流问题。" : ""
          ].filter(Boolean).join(" ");
      } catch (error) {
        this.statusText = this.lang === "zh"
          ? `贴片背景生成失败：${error.message}`
          : `Sticker generation failed: ${error.message}`;
      } finally {
        this.runningStep = "";
      }
    },
    async runTextLayer() {
      if (!this.stickerOutputs.top) {
        this.statusText = this.labels.textNeedsTop;
        return;
      }
      this.runningStep = "text-layer";
      this.statusText = this.labels.running;
      try {
        const fontReferenceImage = await this.fontReferenceImageForRun();
        const data = await this.postWorkflow("/api/ai-workflow/text-layer", {
          lang: this.lang,
          copyText: this.copyText,
          promptText: this.textLayerPrompt,
          styleKey: ["reference", "rounded"].includes(this.selectedFontStyle) ? "clean" : this.selectedFontStyle,
          fontPresetKey: this.fontPresetKeyForRun(),
          fontReferenceSource: this.selectedFontStyle === "reference" ? "upload" : "preset",
          topStickerImage: this.stickerOutputs.top,
          referenceImage: this.stickerOutputs.top,
          fontReferenceImage,
          sourceTypographyReferenceImage: this.extractTextStyleFromReference ? this.referenceDataUrl : ""
        });
        this.textLayerDraftOutput = data.assets?.whiteDraft || "";
        this.textLayerOutput = data.assets?.transparent || "";
        this.textLayerPromptBuilt = data.prompt || "";
        this.textLayerVerified = false;
        this.assets[0].ready = true;
        this.statusText = data.message;
        this.placeTextLayer(false);
      } catch (error) {
        this.statusText = this.lang === "zh"
          ? `文字图层生成失败：${error.message}`
          : `Text layer generation failed: ${error.message}`;
      } finally {
        this.runningStep = "";
      }
    },
    recordStickerOutputSize(kind, event) {
      const image = event.target;
      if (!image?.naturalWidth || !image?.naturalHeight) return;
      this.stickerOutputSizes = {
        ...this.stickerOutputSizes,
        [kind]: {
          width: image.naturalWidth,
          height: image.naturalHeight
        }
      };
    },
    stickerPieceStyle(kind) {
      const size = this.stickerOutputSizes[kind] || { width: 1, height: 1 };
      return {
        aspectRatio: `${size.width} / ${size.height}`
      };
    },
    scaledHeightForWidth(size, width) {
      if (!size?.width || !size?.height) return Math.round(width * 0.4);
      return Math.round(width * (size.height / size.width));
    },
    toPercentX(value) {
      return `${(value / this.compositionSize.width) * 100}%`;
    },
    toPercentY(value) {
      return `${(value / this.compositionSize.height) * 100}%`;
    },
    simulateRun(step) {
      this.runningStep = step;
      this.statusText = this.labels.running;
      window.setTimeout(() => {
        this.runningStep = "";
        this.statusText = this.statusByStep(step);
        if (step === "sticker-bg") {
          this.assets[1].ready = true;
          this.assets[2].ready = true;
          this.assets[3].ready = true;
        }
        if (step === "text-layer" || step === "cutout" || step === "place-text") {
          this.assets[0].ready = true;
        }
        if (step === "export") {
          this.assets.forEach((asset) => {
            asset.ready = true;
          });
        }
      }, 680);
    },
    statusByStep(step) {
      const zh = {
        "sticker-bg": "已生成上贴、侧贴、下贴背景占位结果",
        "text-layer": "已生成文字图层占位结果",
        cutout: "已抠出透明 png 占位结果",
        "place-text": "文字框已置入合成预览",
        export: "已准备批量导出清单"
      };
      const en = {
        "sticker-bg": "Top, side, and bottom placeholders generated",
        "text-layer": "Text layer placeholder generated",
        cutout: "Transparent png placeholder generated",
        "place-text": "Text box placed in preview",
        export: "Batch export list ready"
      };
      return (this.lang === "zh" ? zh : en)[step] || (this.lang === "zh" ? "已完成" : "Done");
    },
    setFadeTarget(target) {
      this.activeFadeTarget = target;
      this.activeFusionMode = "fade";
      this.statusText = target === "top"
        ? (this.lang === "zh" ? "正在绘制上贴渐隐线：线以上保留" : "Drawing top fade line: keep above the line")
        : (this.lang === "zh" ? "正在绘制下贴渐隐线：线以下保留" : "Drawing bottom fade line: keep below the line");
    },
    startFadeMode() {
      this.activeFusionMode = "fade";
      this.previewPeekTarget = "";
      this.statusText = this.lang === "zh"
        ? "移动到上贴或下贴区域后直接拖动画线，系统会自动判断渐隐对象。"
        : "Move over the top or bottom sticker and drag to draw; the target is detected automatically.";
    },
    resizeCompositionForDisplay() {
      const board = this.$refs.compositionBoard;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      this.boardSize.width = Math.max(1, Math.round(rect.width));
      this.boardSize.height = Math.max(1, Math.round(rect.height));
      this.keepTextLayerInBounds();
      this.keepSideLayerInBounds();
      this.resizeCanvasForDisplay();
    },
    resizeCanvasForDisplay() {
      const canvas = this.$refs.pathCanvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.redrawPath();
    },
    getRawCompositionPoint(event) {
      const rect = this.$refs.pathCanvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (this.compositionSize.width / rect.width);
      const y = (event.clientY - rect.top) * (this.compositionSize.height / rect.height);
      return {
        x: Math.min(Math.max(x, 0), this.compositionSize.width),
        y: Math.min(Math.max(y, 0), this.compositionSize.height)
      };
    },
    targetFromPoint(point) {
      if (point.y <= this.topStickerHeight) return "top";
      if (point.y >= this.bottomStickerY) return "bottom";
      return this.activeFadeTarget;
    },
    updatePeekTarget(event) {
      if (this.activeFusionMode !== "fade") {
        this.previewPeekTarget = "";
        return;
      }
      const point = this.getRawCompositionPoint(event);
      this.previewPeekTarget = point.y <= this.topStickerHeight
        ? "top"
        : (point.y >= this.bottomStickerY ? "bottom" : "");
    },
    getPoint(event, target = this.activeFadeTarget) {
      return this.constrainPointToSticker(this.getRawCompositionPoint(event), target);
    },
    constrainPointToSticker(point, target) {
      const padding = 34;
      const x = Math.min(Math.max(point.x, 0), this.compositionSize.width);
      if (target === "top") {
        return { x, y: Math.min(Math.max(point.y, padding), this.topStickerHeight - padding) };
      }
      return { x, y: Math.min(Math.max(point.y, this.bottomStickerY + padding), this.compositionSize.height - padding) };
    },
    startDrawing(event) {
      if (this.activeFusionMode !== "fade") return;
      const target = this.targetFromPoint(this.getRawCompositionPoint(event));
      this.activeFadeTarget = target;
      this.previewPeekTarget = target;
      this.isDrawing = true;
      if (target === "top") {
        this.topPathPoints = [this.getPoint(event, target)];
      } else {
        this.bottomPathPoints = [this.getPoint(event, target)];
      }
      this.$refs.pathCanvas.setPointerCapture(event.pointerId);
      this.redrawPath();
    },
    continueDrawing(event) {
      if (!this.isDrawing) {
        this.updatePeekTarget(event);
        return;
      }
      const point = this.getPoint(event);
      const pathPoints = this.activeFadeTarget === "top" ? this.topPathPoints : this.bottomPathPoints;
      const last = pathPoints[pathPoints.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) > 10) {
        if (this.activeFadeTarget === "top") {
          this.topPathPoints = this.smoothPointList([...pathPoints, point]);
        } else {
          this.bottomPathPoints = this.smoothPointList([...pathPoints, point]);
        }
        this.redrawPath();
      }
    },
    endDrawing(event) {
      if (!this.isDrawing) {
        this.previewPeekTarget = "";
        this.redrawPath();
        return;
      }
      this.isDrawing = false;
      this.previewPeekTarget = "";
      if (event.pointerId !== undefined) this.$refs.pathCanvas.releasePointerCapture(event.pointerId);
      this.redrawPath();
      this.statusText = this.activeFadeTarget === "top"
        ? (this.lang === "zh" ? "上贴渐隐线已记录，线以下进入透明过渡" : "Top fade line recorded")
        : (this.lang === "zh" ? "下贴渐隐线已记录，线以上进入透明过渡" : "Bottom fade line recorded");
    },
    redrawPath() {
      const canvas = this.$refs.pathCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!this.isDrawing) return;
      ctx.save();
      ctx.scale(rect.width / this.compositionSize.width, rect.height / this.compositionSize.height);
      this.drawPath(ctx, this.topPathPoints, "rgba(255, 255, 255, 0.9)", "rgba(11, 11, 15, 0.8)");
      this.drawPath(ctx, this.bottomPathPoints, "rgba(255, 255, 255, 0.9)", "rgba(11, 11, 15, 0.8)");
      ctx.restore();
    },
    drawPath(ctx, pathPoints, haloColor, strokeColor) {
      if (pathPoints.length < 2) return;
      const points = this.smoothPointList(pathPoints);
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = haloColor;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i += 1) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.stroke();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    },
    clearPath() {
      if (this.activeFadeTarget === "top") {
        this.topPathPoints = [];
      } else {
        this.bottomPathPoints = [];
      }
      this.redrawPath();
      this.statusText = this.activeFadeTarget === "top"
        ? (this.lang === "zh" ? "上贴渐隐线已清除" : "Top fade line cleared")
        : (this.lang === "zh" ? "下贴渐隐线已清除" : "Bottom fade line cleared");
    },
    pointsToPath(points) {
      if (points.length < 2) return "";
      const smoothed = this.smoothPointList(points);
      const commands = [`M ${smoothed[0].x} ${smoothed[0].y}`];
      for (let i = 1; i < smoothed.length - 1; i += 1) {
        const midX = (smoothed[i].x + smoothed[i + 1].x) / 2;
        const midY = (smoothed[i].y + smoothed[i + 1].y) / 2;
        commands.push(`Q ${smoothed[i].x} ${smoothed[i].y} ${midX} ${midY}`);
      }
      commands.push(`L ${smoothed[smoothed.length - 1].x} ${smoothed[smoothed.length - 1].y}`);
      return commands.join(" ");
    },
    smoothPointList(points) {
      if (points.length < 3) return points;
      return points.map((point, index) => {
        if (index === 0 || index === points.length - 1) return point;
        const previous = points[index - 1];
        const next = points[index + 1];
        return {
          x: Math.round((previous.x + point.x * 2 + next.x) / 4),
          y: Math.round((previous.y + point.y * 2 + next.y) / 4)
        };
      });
    },
    normalizedPath(points, fallbackY, target) {
      const source = points.length > 1 ? points : this.defaultFadeLine(fallbackY);
      const sorted = this.smoothPointList([...source].sort((a, b) => a.x - b.x));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      return [
        this.constrainPointToSticker({ x: 0, y: first.y }, target),
        ...sorted.map((point) => this.constrainPointToSticker(point, target)),
        this.constrainPointToSticker({ x: this.compositionSize.width, y: last.y }, target)
      ];
    },
    defaultFadeLine(y) {
      return [
        { x: 0, y },
        { x: this.compositionSize.width * 0.35, y: y + 18 },
        { x: this.compositionSize.width * 0.7, y: y - 22 },
        { x: this.compositionSize.width, y }
      ];
    },
    placeTextLayer(runStatus = true) {
      if (runStatus) this.activeFusionMode = "text";
      this.textLayerVisible = true;
      this.centerTextLayer();
      if (runStatus) this.simulateRun("place-text");
    },
    centerTextLayer() {
      this.textLayer.width = Math.round(this.compositionSize.width * 0.68);
      this.textLayer.height = Math.round(this.textLayer.width * 0.28);
      this.textLayer.x = (this.compositionSize.width - this.textLayer.width) / 2;
      this.textLayer.y = Math.max(24, (this.topStickerHeight - this.textLayer.height) / 2);
    },
    keepTextLayerInBounds() {
      this.textLayer.width = Math.min(this.textLayer.width, this.compositionSize.width * 2.4);
      this.textLayer.height = Math.min(this.textLayer.height, this.compositionSize.height * 2.4);
      const visibleHandle = 120;
      this.textLayer.x = Math.min(Math.max(this.textLayer.x, -this.textLayer.width + visibleHandle), this.compositionSize.width - visibleHandle);
      this.textLayer.y = Math.min(Math.max(this.textLayer.y, -this.textLayer.height + visibleHandle), this.compositionSize.height - visibleHandle);
    },
    startTextResize(event) {
      this.activeFusionMode = "text";
      this.textInteraction = {
        type: "resize",
        startX: event.clientX,
        width: this.textLayer.width,
        height: this.textLayer.height,
        centerX: this.textLayer.x + this.textLayer.width / 2,
        centerY: this.textLayer.y + this.textLayer.height / 2
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    moveTextLayer(event) {
      if (!this.textInteraction) return;
      const rect = this.$refs.compositionBoard.getBoundingClientRect();
      const deltaX = (event.clientX - this.textInteraction.startX) * (this.compositionSize.width / rect.width);
      const nextWidth = Math.max(260, this.textInteraction.width + deltaX * 2);
      const ratio = this.textInteraction.height / this.textInteraction.width;
      this.textLayer.width = Math.min(nextWidth, this.compositionSize.width * 2.4);
      this.textLayer.height = Math.max(80, this.textLayer.width * ratio);
      this.textLayer.x = this.textInteraction.centerX - this.textLayer.width / 2;
      this.textLayer.y = this.textInteraction.centerY - this.textLayer.height / 2;
      this.keepTextLayerInBounds();
    },
    moveTextLayerByKey(event) {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      this.activeFusionMode = "text";
      const step = event.shiftKey ? 12 : 3;
      if (event.key === "ArrowUp") this.textLayer.y -= step;
      if (event.key === "ArrowDown") this.textLayer.y += step;
      if (event.key === "ArrowLeft") this.textLayer.x -= step;
      if (event.key === "ArrowRight") this.textLayer.x += step;
      this.keepTextLayerInBounds();
    },
    placeSideSticker() {
      this.activeFusionMode = "side";
      this.sideLayerVisible = true;
      this.sideLayer.width = 210;
      this.sideLayer.height = this.sideStickerHeight;
      this.sideLayer.x = 36;
      this.sideLayer.y = Math.round((this.compositionSize.height - this.sideLayer.height) / 2);
      this.keepSideLayerInBounds();
      this.statusText = this.lang === "zh" ? "侧贴已置入，可拖动移动；其他图层已锁定。" : "Side sticker placed. Drag it while other layers stay locked.";
    },
    keepSideLayerInBounds() {
      this.sideLayer.height = this.scaledHeightForWidth(this.stickerOutputSizes.side, this.sideLayer.width);
      this.sideLayer.x = Math.min(Math.max(this.sideLayer.x, 0), this.compositionSize.width - this.sideLayer.width);
      this.sideLayer.y = Math.min(Math.max(this.sideLayer.y, 0), this.compositionSize.height - this.sideLayer.height);
    },
    startSideDrag(event) {
      this.activeFusionMode = "side";
      this.sideInteraction = {
        startX: event.clientX,
        startY: event.clientY,
        x: this.sideLayer.x,
        y: this.sideLayer.y
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    moveSideLayer(event) {
      if (!this.sideInteraction) return;
      const rect = this.$refs.compositionBoard.getBoundingClientRect();
      const deltaX = (event.clientX - this.sideInteraction.startX) * (this.compositionSize.width / rect.width);
      const deltaY = (event.clientY - this.sideInteraction.startY) * (this.compositionSize.height / rect.height);
      this.sideLayer.x = this.sideInteraction.x + deltaX;
      this.sideLayer.y = this.sideInteraction.y + deltaY;
      this.keepSideLayerInBounds();
    },
    moveOverlayInteraction(event) {
      this.moveTextLayer(event);
      this.moveSideLayer(event);
    },
    endOverlayInteraction() {
      this.textInteraction = null;
      this.sideInteraction = null;
    },
    async downloadBatchExport() {
      this.runningStep = "export";
      this.statusText = this.lang === "zh" ? "正在渲染当前预览中的 PNG 图层..." : "Rendering the current preview PNG layers...";
      try {
        const files = await this.renderBatchPngFiles();
        if (!files.length) {
          this.statusText = this.lang === "zh" ? "没有可导出的 PNG 图层。" : "No PNG layers are ready to export.";
          return;
        }
        const zip = this.makeStoredZip(files);
        this.downloadBlob(zip, "ai-mcp-workflow-png-export.zip", "application/zip");
        this.statusText = this.lang === "zh"
          ? `已导出 ${files.length} 个 PNG 文件`
          : `${files.length} PNG files exported`;
      } catch (error) {
        this.statusText = this.lang === "zh"
          ? `批量导出失败：${error.message}`
          : `Batch export failed: ${error.message}`;
      } finally {
        this.runningStep = "";
      }
    },
    isAssetSelected(key) {
      return this.assets.find((asset) => asset.key === key)?.ready !== false;
    },
    async renderBatchPngFiles() {
      const files = [];
      const topCanvas = this.stickerOutputs.top && this.isAssetSelected("top")
        ? await this.renderStickerLayerPng("top")
        : null;
      const bottomCanvas = this.stickerOutputs.bottom && this.isAssetSelected("bottom")
        ? await this.renderStickerLayerPng("bottom")
        : null;
      const textCanvas = this.textLayerVisible && this.isAssetSelected("text")
        ? await this.renderTextLayerPng()
        : null;
      const sideCanvas = this.sideLayerVisible && this.isAssetSelected("side")
        ? await this.renderSideLayerPng()
        : null;

      if (topCanvas) files.push({ name: "top-sticker-1080-fade.png", content: await this.canvasToPngBytes(topCanvas) });
      if (bottomCanvas) files.push({ name: "bottom-sticker-1080-fade.png", content: await this.canvasToPngBytes(bottomCanvas) });
      if (textCanvas) files.push({ name: "text-layer-scaled-1x.png", content: await this.canvasToPngBytes(textCanvas) });
      if (sideCanvas) files.push({ name: "side-sticker-placed-210.png", content: await this.canvasToPngBytes(sideCanvas) });
      if (this.isAssetSelected("composite")) {
        const compositeCanvas = await this.renderCompositePng({ topCanvas, bottomCanvas, textCanvas, sideCanvas });
        files.push({ name: "composite-1080x1920.png", content: await this.canvasToPngBytes(compositeCanvas) });
      }
      return files;
    },
    createRenderCanvas(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      return canvas;
    },
    async loadImageSource(source) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("图片读取失败"));
        image.src = source;
      });
    },
    drawImageContain(ctx, image, x, y, width, height) {
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    },
    drawImageCover(ctx, image, x, y, width, height) {
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    },
    async renderStickerLayerPng(kind) {
      const source = this.stickerOutputs[kind];
      if (!source) return null;
      const height = kind === "top" ? this.topStickerHeight : this.bottomStickerHeight;
      const offsetY = kind === "top" ? 0 : this.bottomStickerY;
      const image = await this.loadImageSource(source);
      const canvas = this.createRenderCanvas(this.compositionSize.width, height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.applyStickerMask(canvas, kind, offsetY);
      return canvas;
    },
    applyStickerMask(canvas, kind, offsetY = 0) {
      const mask = this.createRenderCanvas(canvas.width, canvas.height);
      const maskCtx = mask.getContext("2d");
      const path = new Path2D(kind === "top" ? this.topMaskD : this.bottomMaskD);
      maskCtx.save();
      maskCtx.translate(0, -offsetY);
      maskCtx.filter = `blur(${kind === "top" ? 42 : 42}px)`;
      maskCtx.fillStyle = "#fff";
      maskCtx.fill(path);
      maskCtx.restore();

      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.restore();
    },
    async renderTextLayerPng() {
      const canvas = this.createRenderCanvas(this.textLayer.width, this.textLayer.height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (this.textLayerOutput) {
        const image = await this.loadImageSource(this.textLayerOutput);
        this.drawImageContain(ctx, image, 0, 0, canvas.width, canvas.height);
      } else {
        this.drawFallbackText(ctx, canvas.width, canvas.height);
      }
      return canvas;
    },
    async renderSideLayerPng() {
      const canvas = this.createRenderCanvas(this.sideLayer.width, this.sideLayer.height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (this.stickerOutputs.side) {
        const image = await this.loadImageSource(this.stickerOutputs.side);
        this.drawImageContain(ctx, image, 0, 0, canvas.width, canvas.height);
      }
      return canvas;
    },
    async renderCompositePng(renderedLayers = {}) {
      const canvas = this.createRenderCanvas(this.compositionSize.width, this.compositionSize.height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (this.liveRoomDataUrl || this.liveRoomUrl) {
        const image = await this.loadImageSource(this.liveRoomDataUrl || this.liveRoomUrl);
        this.drawImageCover(ctx, image, 0, 0, canvas.width, canvas.height);
      }
      const topCanvas = renderedLayers.topCanvas || (this.stickerOutputs.top ? await this.renderStickerLayerPng("top") : null);
      const bottomCanvas = renderedLayers.bottomCanvas || (this.stickerOutputs.bottom ? await this.renderStickerLayerPng("bottom") : null);
      if (topCanvas) ctx.drawImage(topCanvas, 0, 0);
      if (bottomCanvas) ctx.drawImage(bottomCanvas, 0, this.bottomStickerY);

      const textCanvas = renderedLayers.textCanvas || (this.textLayerVisible ? await this.renderTextLayerPng() : null);
      if (textCanvas) ctx.drawImage(textCanvas, Math.round(this.textLayer.x), Math.round(this.textLayer.y));

      const sideCanvas = renderedLayers.sideCanvas || (this.sideLayerVisible ? await this.renderSideLayerPng() : null);
      if (sideCanvas) ctx.drawImage(sideCanvas, Math.round(this.sideLayer.x), Math.round(this.sideLayer.y));
      return canvas;
    },
    drawFallbackText(ctx, width, height) {
      const lines = this.expectedCopyLines.length ? this.expectedCopyLines : [this.textLayerDisplay || ""];
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(24, Math.round(width / 13))}px "MiSans", "Alibaba PuHuiTi", sans-serif`;
      const lineHeight = Math.max(34, Math.round(width / 10));
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight, width * 0.92);
      });
      ctx.restore();
    },
    canvasToPngBytes(canvas) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error("PNG 导出失败"));
            return;
          }
          resolve(new Uint8Array(await blob.arrayBuffer()));
        }, "image/png");
      });
    },
    stickerDownloadName(kind) {
      const names = {
        top: "top-sticker-background.png",
        side: "side-sticker-background.png",
        bottom: "bottom-sticker-background.png"
      };
      return names[kind] || "sticker-background.png";
    },
    downloadGeneratedImage(source, filename) {
      if (!source) return;
      const mime = source.match(/^data:([^;,]+)/)?.[1] || "";
      const extension = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/svg+xml": "svg"
      }[mime];
      const downloadName = extension
        ? filename.replace(/\.[a-z0-9]+$/i, `.${extension}`)
        : filename;
      const link = document.createElement("a");
      link.href = source;
      link.download = downloadName;
      link.rel = "noopener";
      link.click();
    },
    downloadBlob(content, filename, type) {
      const blob = new Blob([content], { type });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
    crc32(bytes) {
      let crc = -1;
      for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
          crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
      }
      return (crc ^ -1) >>> 0;
    },
    writeUint16(target, offset, value) {
      target[offset] = value & 0xff;
      target[offset + 1] = (value >>> 8) & 0xff;
    },
    writeUint32(target, offset, value) {
      target[offset] = value & 0xff;
      target[offset + 1] = (value >>> 8) & 0xff;
      target[offset + 2] = (value >>> 16) & 0xff;
      target[offset + 3] = (value >>> 24) & 0xff;
    },
    makeStoredZip(files) {
      const encoder = new TextEncoder();
      const localParts = [];
      const centralParts = [];
      let offset = 0;
      files.forEach((file) => {
        const name = encoder.encode(file.name);
        const content = file.content;
        const crc = this.crc32(content);
        const local = new Uint8Array(30 + name.length + content.length);
        this.writeUint32(local, 0, 0x04034b50);
        this.writeUint16(local, 4, 20);
        this.writeUint16(local, 8, 0);
        this.writeUint32(local, 14, crc);
        this.writeUint32(local, 18, content.length);
        this.writeUint32(local, 22, content.length);
        this.writeUint16(local, 26, name.length);
        local.set(name, 30);
        local.set(content, 30 + name.length);
        localParts.push(local);

        const central = new Uint8Array(46 + name.length);
        this.writeUint32(central, 0, 0x02014b50);
        this.writeUint16(central, 4, 20);
        this.writeUint16(central, 6, 20);
        this.writeUint32(central, 16, crc);
        this.writeUint32(central, 20, content.length);
        this.writeUint32(central, 24, content.length);
        this.writeUint16(central, 28, name.length);
        this.writeUint32(central, 42, offset);
        central.set(name, 46);
        centralParts.push(central);
        offset += local.length;
      });
      const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
      const end = new Uint8Array(22);
      this.writeUint32(end, 0, 0x06054b50);
      this.writeUint16(end, 8, files.length);
      this.writeUint16(end, 10, files.length);
      this.writeUint32(end, 12, centralSize);
      this.writeUint32(end, 16, offset);
      return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
    }
  },
  template: `
    <section class="task-map-demo ai-workflow-demo" aria-label="AI MCP workflow demo">
      <div class="task-map-demo__intro">
        <p class="task-map-demo__kicker">{{ labels.kicker }}</p>
        <h2>{{ labels.title }}</h2>
        <p>{{ labels.intro }}</p>
        <p class="ai-service-status" :class="{ online: apiStatus.online, keyless: apiStatus.online && !apiStatus.hasOpenAIKey }">
          {{ apiStatus.message || statusText }}
        </p>
      </div>

      <div class="ai-workflow-tabs" aria-label="Workflow steps">
        <a v-for="step in stepCards" :key="step.index" :href="'#' + step.key">
          <span>{{ step.index }}</span>
          <strong>{{ step.title }}</strong>
        </a>
      </div>

      <div class="ai-workflow-flow">
        <article id="sticker-bg" class="ai-workflow-step">
          <div class="ai-workflow-column ai-workflow-column--input">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.stickerInput }}</span>
                <h3>{{ labels.prototypeInput }}</h3>
              </div>
            </div>
            <label
              class="ai-workflow-upload"
              :class="{ ready: referenceUrl, active: activeUploadTarget === 'reference' }"
              for="aiWorkflowReference"
              tabindex="0"
              @focus="setUploadTarget('reference')"
              @pointerdown="setUploadTarget('reference')"
            >
              <input id="aiWorkflowReference" type="file" accept="image/*" @change="loadReference" />
              <img v-if="referenceUrl" :src="referenceUrl" alt="Reference preview" />
              <strong v-else>+</strong>
              <span>{{ labels.uploadReference }}</span>
              <small>{{ referenceName }}</small>
              <small>{{ labels.pasteHint }}</small>
              <em v-if="referenceUrl">{{ labels.referenceReady }}</em>
            </label>
            <label class="ai-workflow-field">
              <span>{{ labels.prompt }}</span>
              <textarea v-model="promptText" rows="3" :placeholder="labels.promptPlaceholder"></textarea>
            </label>
            <button type="button" class="ai-workflow-button" :disabled="runningStep === 'sticker-bg'" @click="runStickerBackgrounds">
              {{ runningStep === "sticker-bg" ? labels.running : labels.run }}
            </button>
          </div>

          <div class="ai-workflow-column">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.output }}</span>
                <h3>{{ labels.stickerOutput }}</h3>
              </div>
            </div>
            <div class="ai-sticker-board">
              <div class="ai-sticker-piece ai-sticker-piece--top" :style="stickerPieceStyle('top')">
                <img v-if="stickerOutputs.top" :src="stickerOutputs.top" alt="Top sticker background" @load="recordStickerOutputSize('top', $event)" />
                <span>{{ labels.topBg }}</span>
                <button v-if="stickerOutputs.top" type="button" class="ai-download-original" @click.stop="downloadGeneratedImage(stickerOutputs.top, stickerDownloadName('top'))">{{ labels.downloadOriginal }}</button>
              </div>
              <div class="ai-sticker-piece ai-sticker-piece--side" :style="stickerPieceStyle('side')">
                <img v-if="stickerOutputs.side" :src="stickerOutputs.side" alt="Side sticker background" @load="recordStickerOutputSize('side', $event)" />
                <span>{{ labels.sideBg }}</span>
                <button v-if="stickerOutputs.side" type="button" class="ai-download-original" @click.stop="downloadGeneratedImage(stickerOutputs.side, stickerDownloadName('side'))">{{ labels.downloadOriginal }}</button>
              </div>
              <div class="ai-sticker-piece ai-sticker-piece--bottom" :style="stickerPieceStyle('bottom')">
                <img v-if="stickerOutputs.bottom" :src="stickerOutputs.bottom" alt="Bottom sticker background" @load="recordStickerOutputSize('bottom', $event)" />
                <span>{{ labels.bottomBg }}</span>
                <button v-if="stickerOutputs.bottom" type="button" class="ai-download-original" @click.stop="downloadGeneratedImage(stickerOutputs.bottom, stickerDownloadName('bottom'))">{{ labels.downloadOriginal }}</button>
              </div>
              <div
                v-if="runningStep === 'sticker-bg'"
                class="ai-generation-loader"
                role="status"
                aria-live="polite"
                :aria-label="loadingMessage"
              >
                <span :key="loadingMessage" class="figma-loader__message">{{ loadingMessage }}</span>
                <span class="figma-loader__rule"></span>
                <small>{{ statusText }}</small>
              </div>
            </div>
          </div>
        </article>

        <article id="text-layer" class="ai-workflow-step">
          <div class="ai-workflow-column ai-workflow-column--input">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.textInput }}</span>
                <h3>{{ labels.prototypeInput }}</h3>
              </div>
            </div>
            <label class="ai-workflow-field">
              <span>{{ labels.textContent }}</span>
              <textarea v-model="copyText" rows="5"></textarea>
            </label>
            <label class="ai-workflow-field">
              <span>{{ labels.prompt }}</span>
              <textarea v-model="textLayerPrompt" rows="3"></textarea>
            </label>
            <div class="ai-workflow-toolrow">
              <button type="button" :class="{ active: selectedFontStyle === 'clean' }" @click="selectFontStyle('clean')">{{ labels.fontOne }}</button>
              <button type="button" :class="{ active: selectedFontStyle === 'expressive' }" @click="selectFontStyle('expressive')">{{ labels.fontTwo }}</button>
              <button type="button" :class="{ active: selectedFontStyle === 'rounded' }" @click="selectFontStyle('rounded')">{{ labels.fontRounded }}</button>
              <button type="button" :class="{ active: selectedFontStyle === 'reference' }" @click="selectFontStyle('reference')">{{ labels.fontReferenceMode }}</button>
            </div>
            <label
              v-if="selectedFontStyle === 'reference'"
              class="ai-workflow-upload ai-workflow-upload--short"
              :class="{ ready: fontReferenceDataUrl, active: activeUploadTarget === 'font' }"
              for="aiWorkflowFontReference"
              tabindex="0"
              @focus="setUploadTarget('font')"
              @pointerdown="setUploadTarget('font')"
            >
              <input id="aiWorkflowFontReference" type="file" accept="image/*" @change="loadFontReference" />
              <img v-if="fontReferenceUrl" :src="fontReferenceUrl" alt="Font reference preview" />
              <strong v-else>+</strong>
              <span>{{ labels.uploadFontReference }}</span>
              <small>{{ fontReferenceName }}</small>
              <small>{{ labels.pasteHint }}</small>
              <em v-if="fontReferenceDataUrl">{{ labels.fontReferenceReady }}</em>
            </label>
            <label class="ai-reference-style-toggle" :class="{ active: extractTextStyleFromReference }">
              <input type="checkbox" v-model="extractTextStyleFromReference" :disabled="!referenceDataUrl" />
              <span>
                <strong>{{ labels.extractReferenceTextStyle }}</strong>
                <small>{{ labels.extractReferenceTextStyleHint }}</small>
              </span>
            </label>
            <p class="ai-status-line">{{ labels.textReferenceTop }}</p>
            <button type="button" class="ai-workflow-button" :disabled="runningStep === 'text-layer'" @click="runTextLayer">
              {{ runningStep === "text-layer" ? labels.running : labels.run }}
            </button>
          </div>

          <div class="ai-workflow-column">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.output }}</span>
                <h3>{{ labels.stickerOutput }}</h3>
              </div>
            </div>
            <div class="ai-text-output-stack">
              <div class="ai-text-preview">
                <img v-if="textLayerDraftOutput" :src="textLayerDraftOutput" alt="Generated white typography draft" />
                <span v-else>{{ labels.topText }}</span>
                <button v-if="textLayerDraftOutput" type="button" class="ai-download-original" @click="downloadGeneratedImage(textLayerDraftOutput, 'text-layer-white-draft.png')">{{ labels.whiteDraft }} · {{ labels.downloadOriginal }}</button>
              </div>
              <div class="ai-transparent-export">
                <span v-if="!textLayerOutput">{{ labels.transparentPng }}</span>
                <img v-if="textLayerOutput" :src="textLayerOutput" alt="Transparent text png preview" />
                <button v-if="textLayerOutput" type="button" class="ai-workflow-button" @click="downloadGeneratedImage(textLayerOutput, 'text-layer-transparent.png')">{{ labels.transparentPng }} · {{ labels.downloadOriginal }}</button>
              </div>
              <div
                v-if="runningStep === 'text-layer'"
                class="ai-generation-loader"
                role="status"
                aria-live="polite"
                :aria-label="loadingMessage"
              >
                <span :key="loadingMessage" class="figma-loader__message">{{ loadingMessage }}</span>
                <span class="figma-loader__rule"></span>
                <small>{{ statusText }}</small>
              </div>
            </div>
            <div class="ai-text-audit" :class="{ checked: textLayerVerified }">
              <div>
                <span>{{ labels.manualCheckTitle }}</span>
                <strong>{{ textLayerVerified ? labels.textChecked : labels.textUnchecked }}</strong>
              </div>
              <p>{{ labels.manualCheckBody }}</p>
              <dl>
                <dt>{{ labels.expectedCopy }}</dt>
                <dd>
                  <span v-for="line in expectedCopyLines" :key="line">{{ line }}</span>
                </dd>
              </dl>
              <label>
                <input type="checkbox" v-model="textLayerVerified" :disabled="!textLayerDraftOutput && !textLayerOutput" />
                <span>{{ labels.confirmTextAccurate }}</span>
              </label>
            </div>
          </div>
        </article>

        <article id="fusion" class="ai-workflow-step ai-workflow-step--fusion">
          <div class="ai-workflow-column ai-workflow-column--input">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.fusionInput }}</span>
                <h3>{{ labels.prototypeInput }}</h3>
              </div>
            </div>
            <label
              class="ai-workflow-upload ai-workflow-upload--tall"
              :class="{ ready: liveRoomUrl, active: activeUploadTarget === 'liveRoom' }"
              for="aiWorkflowLiveRoom"
              tabindex="0"
              @focus="setUploadTarget('liveRoom')"
              @pointerdown="setUploadTarget('liveRoom')"
            >
              <input id="aiWorkflowLiveRoom" type="file" accept="image/*" @change="loadLiveRoom" />
              <img v-if="liveRoomUrl" :src="liveRoomUrl" alt="Live-room upload preview" />
              <strong v-else>+</strong>
              <span>{{ labels.uploadLiveRoom }}</span>
              <small>{{ liveRoomName }}</small>
              <small>{{ labels.pasteHint }}</small>
            </label>
          </div>

          <div class="ai-workflow-column">
            <div class="ai-workflow-heading-inline">
              <div class="task-map-panel__header">
                <div>
                  <span>{{ labels.output }}</span>
                  <h3>{{ labels.stickerEffect }}</h3>
                </div>
              </div>
              <div class="ai-workflow-toolrow">
                <button type="button" :class="{ active: activeFusionMode === 'fade' }" @click="startFadeMode">{{ labels.fadeBrush }}</button>
                <button type="button" :class="{ active: activeFusionMode === 'text' }" @click="placeTextLayer">{{ labels.placeText }}</button>
                <button type="button" :class="{ active: activeFusionMode === 'side' }" @click="placeSideSticker">{{ labels.placeSide }}</button>
              </div>
            </div>
            <div
              ref="compositionBoard"
              class="ai-composition-board"
              :class="{
                'is-fade-mode': activeFusionMode === 'fade',
                'is-text-mode': activeFusionMode === 'text',
                'is-side-mode': activeFusionMode === 'side'
              }"
            >
              <img v-if="liveRoomUrl" class="ai-composition-base" :src="liveRoomUrl" alt="Live-room screenshot" />
              <div class="ai-composition-center">{{ labels.liveRoomBase }}</div>
              <div class="ai-mobile-safe-lines" aria-hidden="true" data-export-ignore>
                <span v-for="line in safeLineStyles" :key="line.left" :style="line"></span>
              </div>
              <svg
                class="ai-sticker-composite"
                :class="{
                  'is-peeking-top': previewPeekTarget === 'top',
                  'is-peeking-bottom': previewPeekTarget === 'bottom'
                }"
                :viewBox="'0 0 ' + compositionSize.width + ' ' + compositionSize.height"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <filter id="aiFadeBlur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="42" />
                  </filter>
                  <mask id="aiTopStickerMask" maskUnits="userSpaceOnUse" :x="-stickerFadeBleed" :y="-stickerFadeBleed" :width="compositionSize.width + stickerFadeBleed * 2" :height="compositionSize.height + stickerFadeBleed * 2">
                    <rect :x="-stickerFadeBleed" :y="-stickerFadeBleed" :width="compositionSize.width + stickerFadeBleed * 2" :height="compositionSize.height + stickerFadeBleed * 2" fill="black" />
                    <path :d="topMaskD" fill="white" filter="url(#aiFadeBlur)" />
                  </mask>
                  <mask id="aiBottomStickerMask" maskUnits="userSpaceOnUse" :x="-stickerFadeBleed" :y="-stickerFadeBleed" :width="compositionSize.width + stickerFadeBleed * 2" :height="compositionSize.height + stickerFadeBleed * 2">
                    <rect :x="-stickerFadeBleed" :y="-stickerFadeBleed" :width="compositionSize.width + stickerFadeBleed * 2" :height="compositionSize.height + stickerFadeBleed * 2" fill="black" />
                    <path :d="bottomMaskD" fill="white" filter="url(#aiFadeBlur)" />
                  </mask>
                </defs>
                <image v-if="stickerOutputs.top" class="ai-sticker-layer ai-sticker-layer--top" :href="stickerOutputs.top" x="0" y="0" :width="compositionSize.width" :height="topStickerHeight" preserveAspectRatio="xMidYMin meet" mask="url(#aiTopStickerMask)" />
                <rect v-else class="ai-sticker-layer ai-sticker-fill ai-sticker-layer--top" x="0" y="0" :width="compositionSize.width" :height="topStickerHeight" mask="url(#aiTopStickerMask)" />
                <image v-if="stickerOutputs.bottom" class="ai-sticker-layer ai-sticker-layer--bottom" :href="stickerOutputs.bottom" x="0" :y="bottomStickerY" :width="compositionSize.width" :height="bottomStickerHeight" preserveAspectRatio="xMidYMax meet" mask="url(#aiBottomStickerMask)" />
                <rect v-else class="ai-sticker-layer ai-sticker-fill ai-sticker-layer--bottom" x="0" :y="bottomStickerY" :width="compositionSize.width" :height="bottomStickerHeight" mask="url(#aiBottomStickerMask)" />
                <text v-if="!stickerOutputs.top" class="ai-sticker-label" :x="compositionSize.width / 2" :y="Math.max(64, topStickerHeight * 0.46)" text-anchor="middle">{{ labels.topBg }}</text>
                <text v-if="!stickerOutputs.bottom" class="ai-sticker-label" :x="compositionSize.width / 2" :y="bottomStickerY + bottomStickerHeight * 0.55" text-anchor="middle">{{ labels.bottomBg }}</text>
              </svg>
              <div
                v-if="textLayerVisible"
                class="ai-draggable-text-layer"
                :style="textLayerStyle"
                tabindex="0"
                @keydown="moveTextLayerByKey"
              >
                <div class="ai-text-layer-content">
                  <img v-if="textLayerOutput" :src="textLayerOutput" alt="Text layer" />
                  <span v-else>{{ textLayerDisplay }}</span>
                </div>
                <small class="ai-text-layer-hint">{{ labels.textMoveHint }}</small>
                <button class="ai-text-resize-handle" type="button" aria-label="Resize text box" @pointerdown.stop="startTextResize"></button>
              </div>
              <div
                v-if="sideLayerVisible"
                class="ai-side-sticker-layer"
                :style="sideLayerStyle"
                @pointerdown="startSideDrag"
              >
                <img v-if="stickerOutputs.side" :src="stickerOutputs.side" alt="Side sticker" />
                <span v-else>{{ labels.sideBg }}</span>
              </div>
              <canvas
                ref="pathCanvas"
                @pointerdown="startDrawing"
                @pointermove="continueDrawing"
                @pointerup="endDrawing"
                @pointerleave="endDrawing"
              ></canvas>
              <div
                v-if="runningStep === 'place-text'"
                class="ai-generation-loader"
                role="status"
                aria-live="polite"
                :aria-label="loadingMessage"
              >
                <span :key="loadingMessage" class="figma-loader__message">{{ loadingMessage }}</span>
                <span class="figma-loader__rule"></span>
                <small>{{ statusText }}</small>
              </div>
            </div>
          </div>

          <div class="ai-export-panel">
            <div class="task-map-panel__header">
              <div>
                <span>{{ labels.output }}</span>
                <h3>{{ labels.exportTitle }}</h3>
              </div>
            </div>
            <div class="ai-workflow-assets ai-workflow-assets--grid">
              <label v-for="asset in assets" :key="asset.title" :class="{ ready: asset.ready }">
                <input type="checkbox" :checked="asset.ready" @change="asset.ready = $event.target.checked" />
                <strong>{{ asset.title }}</strong>
                <small>{{ asset.copy }}</small>
              </label>
            </div>
            <div class="ai-export-actions">
              <button type="button" class="ai-workflow-button" @click="downloadBatchExport">{{ labels.exportAll }}</button>
            </div>
            <div
              v-if="runningStep === 'export'"
              class="ai-generation-loader ai-generation-loader--panel"
              role="status"
              aria-live="polite"
              :aria-label="loadingMessage"
            >
              <span :key="loadingMessage" class="figma-loader__message">{{ loadingMessage }}</span>
              <span class="figma-loader__rule"></span>
              <small>{{ statusText }}</small>
            </div>
            <p class="ai-status-line">{{ statusText }}</p>
          </div>
        </article>
      </div>
    </section>
  `
};
