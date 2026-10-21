import "../styles/time-story.css";
import TimePhoto from './TimePhoto.js';
import TimeImage from './TimeImage.js';
import { mediaPhotos, sketches, models, technology, making, details, exhibition } from '../data/timeStoryAssets.js';

export default {
  name: "TimeStory",
  components: { TimePhoto, TimeImage },
  props: { lang: { type: String, required: true } },
  data: () => ({ active: 0, makingIndex: 0, inspected: null, viewerBackground: '#090b0e', mediaPhotos, sketches, models, technology, making, details, exhibition }),
  methods: {
    inspect(photo) { this.inspected = photo; this.viewerBackground = photo.background; this.$nextTick(() => this.$refs.viewer.showModal()); },
    closeViewer() { this.$refs.viewer.close(); },
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
        <button @click="jump('time-making')">04 / {{ zh ? '现场搭建' : 'Making' }}</button>
        <button @click="jump('time-exhibition')">05 / {{ zh ? '最终展示' : 'Exhibition' }}</button>
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
        <div class="time-story__mood" :aria-label="media[active].name"><TimePhoto v-for="photo in mediaPhotos[active]" :key="photo.src" :photo="photo" :lang="lang" @inspect="inspect" /></div>
        <p class="time-story__note">{{ zh ? '以上为原稿中的媒介与情绪参考，不是装置实拍。点击图片可放大查看。' : 'Original visual and mood references, not installation photographs. Select an image to enlarge it.' }}</p>
      </section>
      <section id="time-space" class="time-story__part">
        <p class="time-story__eyebrow">PART 03 / SPATIAL INTERACTION</p>
        <header><h2>{{ zh ? '一个空间，\\n两种时间体验。' : 'One space.\\nTwo experiences of time.' }}</h2><p>{{ zh ? '原方案通过手部位置与预设体验时间驱动两种输出：灵活的互动与迟钝的互动。声音、投影和环境光一起参与叙事。' : 'Hand position and a preset experience duration drive two contrasting outputs. Sound, projection and environmental light work together.' }}</p></header>
        <div class="time-story__sketches"><TimePhoto v-for="photo in sketches" :key="photo.src" :photo="photo" :lang="lang" @inspect="inspect" /></div>
        <figure class="time-story__diagram"><img src="/images/study/time-story/space.webp" :alt="zh ? '原稿中的双区域空间剖面与输入输出示意' : 'Original two-zone space and input-output diagram'" loading="lazy"><figcaption>{{ zh ? '原稿空间示意 · 图片保持原比例，下方为可读文字说明' : 'Original spatial proposal · preserved proportions, with readable descriptions below' }}</figcaption></figure>
        <div class="time-story__steps"><article><span>INPUT</span><h3>{{ zh ? '身体进入系统' : 'Body as input' }}</h3><p>{{ zh ? '手部位置、开始时间、预设体验时间。' : 'Hand position, start time and preset duration.' }}</p></article><article><span>PROCESS</span><h3>{{ zh ? '动作被转译' : 'Movement translated' }}</h3><p>{{ zh ? '原稿记录了 TouchDesigner、手部追踪与 Arduino LED 的技术探索。' : 'The archive documents exploration with TouchDesigner, hand tracking and Arduino LEDs.' }}</p></article><article><span>OUTPUT</span><h3>{{ zh ? '多感官的回应' : 'Multisensory response' }}</h3><p>{{ zh ? '波形投影、配乐、顶灯与空间氛围。' : 'Projected waveforms, music, overhead lighting and atmosphere.' }}</p></article></div>
        <h3 class="time-story__subheading">{{ zh ? '从草图到空间模型' : 'From sketch to spatial model' }}</h3>
        <div class="time-story__models"><TimePhoto v-for="photo in models" :key="photo.src" :photo="photo" :lang="lang" @inspect="inspect" /></div>
        <details class="time-story__tech"><summary>{{ zh ? '展开技术原稿 · TouchDesigner / Arduino / Leap Motion' : 'Explore the technical archive · TouchDesigner / Arduino / Leap Motion' }}</summary><div><TimePhoto v-for="photo in technology" :key="photo.src" :photo="photo" :lang="lang" @inspect="inspect" /></div></details>
        <p class="time-story__note">{{ zh ? '页面上方是适配浏览器的交互演绎；原始装置与展示记录保留在下方项目档案中。' : 'The interaction above is a browser adaptation. Original installation material is retained in the project archive below.' }}</p>
      </section>
      <section id="time-making" class="time-story__part">
        <p class="time-story__eyebrow">PART 04 / MAKING THE ATMOSPHERE</p>
        <header><h2>{{ zh ? '把感受，放进空间。' : 'Giving atmosphere a physical form.' }}</h2><p>{{ zh ? '从云层、灯光与雾气的测试，到悬挂、模型和拍摄记录。下面保留原稿里的搭建照片，选择节点切换，点击大图查看细节。' : 'Clouds, light and haze move from experiments into a physical installation. Choose a stage below, then select the main image to inspect it.' }}</p></header>
        <div class="time-story__making"><TimePhoto :photo="making[makingIndex]" :lang="lang" @inspect="inspect" /><div class="time-story__filmstrip" role="group" :aria-label="zh ? '搭建记录' : 'Making archive'"><button v-for="(photo, index) in making" :key="photo.src" :aria-pressed="makingIndex === index" :aria-label="photo[lang]" @click="makingIndex = index"><img :src="photo.src" alt="" loading="lazy"><span>0{{ index + 1 }}</span></button></div></div>
      </section>
      <section id="time-exhibition" class="time-story__part">
        <p class="time-story__eyebrow">PART 05 / FINAL EXHIBITION</p>
        <header><h2>{{ zh ? '时间，不只在表盘上。' : 'Time, beyond the clock face.' }}</h2><p>{{ zh ? '人在场，光与雾在场，动作也成为画面的一部分。这些是作品实际搭建与交互展示的记录。' : 'The visitor, light, haze and movement share the same space. These photographs document the physical installation and its interactions.' }}</p></header>
        <div class="time-story__exhibition"><TimePhoto :photo="exhibition" :lang="lang" @inspect="inspect" /></div>
        <div class="time-story__details"><TimePhoto v-for="photo in details" :key="photo.src" :photo="photo" :lang="lang" @inspect="inspect" /></div>
        <a class="time-story__video" href="https://vimeo.com/753490419" target="_blank" rel="noreferrer">{{ zh ? '观看原始演示视频' : 'Watch the original film' }} <span aria-hidden="true">↗</span><small>Vimeo · {{ zh ? '新窗口打开，部分网络需 VPN' : 'Opens in a new tab; access may vary by network' }}</small></a>
      </section>
      <dialog ref="viewer" class="time-story__viewer" :aria-label="zh ? '图片详情' : 'Image detail'" @click="($event.target === $refs.viewer) && closeViewer()" @close="inspected = null"><div v-if="inspected && !inspected.backgroundLocked" class="time-story__viewer-background" role="group" :aria-label="zh ? '图片底色' : 'Image background'"><button type="button" :aria-pressed="viewerBackground === '#f8f6f6'" @click="viewerBackground = '#f8f6f6'">{{ zh ? '浅底' : 'Light' }}</button><button type="button" :aria-pressed="viewerBackground === '#090b0e'" @click="viewerBackground = '#090b0e'">{{ zh ? '深底' : 'Dark' }}</button></div><button class="time-story__viewer-close" type="button" autofocus @click="closeViewer">{{ zh ? '关闭' : 'Close' }} ×</button><figure v-if="inspected"><div class="time-story__viewer-stage" :style="{ background: inspected.backgroundLocked ? inspected.background : viewerBackground }"><TimeImage :photo="inspected" :lang="lang" eager /></div><figcaption>{{ inspected[lang] }}</figcaption></figure></dialog>
    </section>
  `
};
