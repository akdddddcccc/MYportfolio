import "../styles/time-story.css";

export default {
  name: "TimeStory",
  props: { lang: { type: String, required: true } },
  data: () => ({ active: 0 }),
  methods: {
    jump(id) { this.$el.querySelector('#' + id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  },
  computed: {
    zh() { return this.lang === "zh"; },
    media() {
      return this.zh ? [
        { name: "线 / Line", title: "让时间拥有轮廓", text: "以圆环关联表盘与循环。线条从简洁走向繁复，波形从规则走向不规则，让抽象的时间感受成为可以观看的变化。" },
        { name: "光 / Light", title: "让空间拥有情绪", text: "用暗环境突出发光的交互区域。原方案通过模拟阴天的顶灯与光线变化，将空间氛围纳入体验，而不只是一块屏幕。" },
        { name: "雾 / Smoke", title: "让边界变得模糊", text: "雾气让光的边界柔化，形成陌生、难以把握的空间感。这是原方案的媒介探索方向，并非网页中的实时效果。" },
        { name: "云 / Cloud", title: "让起伏进入节奏", text: "云层与波涛的循环起伏，是原稿中的情绪与动态参考。适度噪波让形态保持呼吸感，不再整齐划一。" }
      ] : [
        { name: "Line", title: "A contour for time", text: "Circular forms recall clock faces and cycles. Lines shift from simple to intricate, making an abstract sensation visible." },
        { name: "Light", title: "An atmosphere for space", text: "A dark environment draws attention to the luminous interaction. The original proposal explores changing overhead lighting." },
        { name: "Smoke", title: "Softening the boundaries", text: "Haze softens the edges of light. This is a medium explored in the original proposal, not a live browser effect." },
        { name: "Cloud", title: "Rhythm through movement", text: "Clouds and waves inform the movement references. Controlled noise gives the form a less uniform, breathing quality." }
      ];
    }
  },
  template: `
    <section class="time-story" aria-label="Design story">
      <nav class="time-story__nav" :aria-label="zh ? '设计章节' : 'Design chapters'">
        <button @click="jump('time-question')">01 / {{ zh ? '设计命题' : 'Question' }}</button>
        <button @click="jump('time-media')">02 / {{ zh ? '媒介语言' : 'Media' }}</button>
        <button @click="jump('time-space')">03 / {{ zh ? '空间交互' : 'Space' }}</button>
      </nav>
      <section id="time-question" class="time-story__part">
        <p class="time-story__eyebrow">PART 01 / PERCEPTION</p>
        <header><h2>{{ zh ? '同样的时间，\\n不同的长度。' : 'The same time.\\nA different duration.' }}</h2><div><p>{{ zh ? '这件作品不试图改变时钟，而是用空间、视觉和声音，讨论我们如何感受时间。原始研究从情绪与主观时间体验的关系出发，把“流畅”和“迟滞”转化为可感知的交互差异。' : 'Rather than changing a clock, this work explores how space, visuals and sound shape our experience of duration. Fluid and delayed responses become a perceptible contrast.' }}</p><small>{{ zh ? '作品中的情绪表达是艺术与交互探索，不是心理测评，也不用于诊断或治疗。' : 'An artistic interaction study, not a psychological assessment, diagnosis or treatment.' }}</small></div></header>
        <div class="time-story__contrast"><article><span>01 / NORMAL</span><h3>{{ zh ? '流畅 · 即时' : 'Fluid · immediate' }}</h3><p>{{ zh ? '灵活的交互反馈，搭配轻松的配乐。动作与回应保持连贯。' : 'Responsive interaction and lighter music keep movement and feedback connected.' }}</p></article><article><span>02 / DEPRESSED</span><h3>{{ zh ? '迟滞 · 纷扰' : 'Delayed · unsettled' }}</h3><p>{{ zh ? '迟钝的反馈、纷繁的线条与悲伤的音乐，共同构成另一种体验氛围。' : 'Slower feedback, intricate lines and sombre music create a contrasting atmosphere.' }}</p></article></div>
      </section>
      <section id="time-media" class="time-story__part">
        <p class="time-story__eyebrow">PART 02 / MATERIAL LANGUAGE</p>
        <header><h2>{{ zh ? '不只看见，\\n也被包围。' : 'Not just seen.\\nSurrounded.' }}</h2><p>{{ zh ? '四种媒介共同构成空间的表达。点击切换，阅读原方案中各自承担的角色。' : 'Four media inform the spatial experience. Select each to explore its role in the original proposal.' }}</p></header>
        <div class="time-story__media"><div class="time-story__choices" role="group" :aria-label="zh ? '媒介选择' : 'Choose a medium'"><button v-for="(item, index) in media" :key="item.name" :aria-pressed="active === index" @click="active = index"><span>0{{ index + 1 }}</span>{{ item.name }}<span aria-hidden="true">↗</span></button></div><article aria-live="polite"><span class="time-story__eyebrow">{{ media[active].name }}</span><h3>{{ media[active].title }}</h3><p>{{ media[active].text }}</p></article></div>
      </section>
      <section id="time-space" class="time-story__part">
        <p class="time-story__eyebrow">PART 03 / SPATIAL INTERACTION</p>
        <header><h2>{{ zh ? '一个空间，\\n两种时间体验。' : 'One space.\\nTwo experiences of time.' }}</h2><p>{{ zh ? '原方案通过手部位置与预设体验时间驱动两种输出：灵活的互动与迟钝的互动。声音、投影和环境光一起参与叙事。' : 'Hand position and a preset experience duration drive two contrasting outputs. Sound, projection and environmental light work together.' }}</p></header>
        <figure class="time-story__diagram"><img src="/images/study/time-story/space.webp" :alt="zh ? '原稿中的双区域空间剖面与输入输出示意' : 'Original two-zone space and input-output diagram'" loading="lazy"><figcaption>{{ zh ? '原稿空间示意 · 图片保持原比例，下方为可读文字说明' : 'Original spatial proposal · preserved proportions, with readable descriptions below' }}</figcaption></figure>
        <div class="time-story__steps"><article><span>INPUT</span><h3>{{ zh ? '身体进入系统' : 'Body as input' }}</h3><p>{{ zh ? '手部位置、开始时间、预设体验时间。' : 'Hand position, start time and preset duration.' }}</p></article><article><span>PROCESS</span><h3>{{ zh ? '动作被转译' : 'Movement translated' }}</h3><p>{{ zh ? '原稿记录了 TouchDesigner、手部追踪与 Arduino LED 的技术探索。' : 'The archive documents exploration with TouchDesigner, hand tracking and Arduino LEDs.' }}</p></article><article><span>OUTPUT</span><h3>{{ zh ? '多感官的回应' : 'Multisensory response' }}</h3><p>{{ zh ? '波形投影、配乐、顶灯与空间氛围。' : 'Projected waveforms, music, overhead lighting and atmosphere.' }}</p></article></div>
        <p class="time-story__note">{{ zh ? '页面上方是适配浏览器的交互演绎；原始装置与展示记录保留在下方项目档案中。' : 'The interaction above is a browser adaptation. Original installation material is retained in the project archive below.' }}</p>
      </section>
    </section>
  `
};
