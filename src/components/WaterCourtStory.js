import "../styles/water-court.css";

const path = file => "/images/study/water-court/" + file;
const copy = {
  zh: {
    name: "水院球场", subtitle: "Water Court Basketball", kind: "工业产品 / 空间概念",
    intro: "一场不计比分的篮球，从几块踏出水面的石头开始。",
    day: "日间", night: "入夜", scene: "水院光景", enlarge: "放大查看", close: "关闭大图",
    dayAlt: "日间水庭半场概念图：步石连接岸与球场，侧墙环抱场内的雕塑篮架。",
    nightAlt: "暮色里的同一水院：场中央的异形图案成为视觉焦点。",
    briefTitle: "球场也可以是一座看台。", brief: "原作《氛围艺术舞台篮球场》设想的不是一场正式比赛。有人约朋友来投几球，也有人只是路过，愿意停下来看。要保住的是投篮的动作和人与球的尺度；场边的轮廓、球面的花纹和傍晚的光，则可以更自由。",
    archive: "原作档案", elevation: "立面推演", elevationAlt: "原案黑白立面线稿，中央细柱撑起篮板，两侧地形与围挡的轮廓起落。",
    note: "两侧起伏，中间留空。围挡负责勾出舞台，而不是把观众关在外面。",
    hoopTitle: "让篮架像一朵花。", hoopBody: "用一根中空分叉的立柱托起花瓣般的篮板。篮圈像一只向前伸出的手镯：远看是庭院里的雕塑，走到篮下，仍能一眼认出瞄准的位置。",
    hoopAlt: "新概念细节：花瓣形篮板、环状篮圈与有机支架。",
    ballTitle: "从场内，伸手取一只球。", ballBody: "共享篮球不必另配一排柜子。把单球凹槽开在侧墙的场内一面，向外探出的上沿遮住雨水。球不在时，空槽也让人知道该把球还在哪里。",
    ballAlt: "新概念细节：薄荷灰纹样篮球放在朝向球场、带上檐的独立凹位里。",
    pattern: "球纹展开", patternAlt: "原稿球纹色样：灰绿底上的黑白曲线、青色圆点和三角。",
    patternNote: "把场线拆成曲线、圆点和三角，再把它们包回球面。同一套图形，从脚下走到了手里。",
    duskNote: "日间靠水面与墙影划出层次。入夜后，把光留给中央的异形图案，不给每一条场线描光。",
    status: "设计说明", credits: "原案：氛围艺术舞台篮球场（2022.09–11）。水院版延续原作与 Water Court Basketball 的构想；立面、球纹取自设计原稿，空间与细节为 GPT 辅助的概念可视化。苏州博物馆的水庭是空间灵感，并非馆方委托、建成实景或施工方案。"
  },
  en: {
    name: "Water Court", subtitle: "Basketball in a water garden", kind: "PRODUCT / SPATIAL CONCEPT",
    intro: "A game without a scoreboard begins on stepping stones just above the water.",
    day: "Daylight", night: "After dark", scene: "Court lighting", enlarge: "Enlarge image", close: "Close image",
    dayAlt: "Daytime concept of a half court surrounded by water, reached by stepping stones and framed by curved side walls.",
    nightAlt: "A twilight view of the water court with the central floor motif as the focus.",
    briefTitle: "A court for spectators, too.", brief: "The original Art Stage Basketball Court was not designed for tournaments. Friends can shoot a few hoops; a passerby can stop to watch. The act of shooting and the scale of the game stay familiar. The perimeter, the surface of the ball and the changing light are open to play.",
    archive: "DESIGN ARCHIVE", elevation: "Elevation study", elevationAlt: "Original line elevation showing the slender central support between rising perimeter walls.",
    note: "The edges rise, the middle opens up. The walls frame the game without shutting out the audience.",
    hoopTitle: "A backboard in bloom.", hoopBody: "A forked, openwork stem supports a petal-like backboard. The rim extends like a bangle: a sculpture from across the garden and an unmistakable target from below.",
    hoopAlt: "Concept detail of the petal backboard, projecting rim and sculptural support.",
    ballTitle: "Take a ball from inside the court.", ballBody: "Individual niches face the playing surface rather than the water. A projecting lip shelters each ball. Even an empty recess tells the next player where the ball belongs.",
    ballAlt: "Concept detail of a patterned sage basketball in a sheltered, court-facing niche.",
    pattern: "Flat pattern", patternAlt: "Original ball artwork with black and white curves, turquoise dots and triangles on sage.",
    patternNote: "Court markings become curves, dots and triangles. Wrapped onto the ball, the graphic language moves from underfoot into the hand.",
    duskNote: "Water and wall shadows define the court by day. After dark, light is reserved for the central motif rather than outlining every marking.",
    status: "DESIGN NOTE", credits: "Based on Art Stage Basketball Court (September–November 2022) and the Water Court Basketball study. The elevation and ball graphic are original design assets; the new spatial and detail studies are GPT-assisted concept visualizations. Inspired by the water garden of Suzhou Museum; not a museum commission, built project or construction proposal."
  }
};

export default {
  name: "WaterCourtStory", props: ["lang"],
  data() { return { mode: "day", enlarged: null }; },
  computed: {
    t() { return copy[this.lang] || copy.zh; },
    overview() { return this.mode === "day" ? "day.webp" : "night.webp"; },
    overviewAlt() { return this.mode === "day" ? this.t.dayAlt : this.t.nightAlt; }
  },
  methods: {
    path,
    async inspect(file, alt) {
      this.enlarged = { file, alt };
      await this.$nextTick();
      this.$refs.viewer.showModal();
    }
  },
  template: `
    <article class="wc-story">
      <header class="wc-mast">
        <div class="wc-meta"><span>WATER COURT &nbsp; / &nbsp; STUDY 01</span><span>{{ t.kind }}</span></div>
        <div class="wc-title-row"><div><p class="wc-eyebrow">{{ t.subtitle }}</p><h1>{{ t.name }}</h1></div><p class="wc-deck">{{ t.intro }}</p></div>
      </header>
      <figure class="wc-main-scene">
        <button type="button" class="wc-photo-open" :aria-label="t.enlarge + ' · ' + overviewAlt" @click="inspect(overview, overviewAlt)">
          <img :src="path(overview)" :alt="overviewAlt" fetchpriority="high" />
        </button>
        <figcaption class="wc-scene-bar">
          <div><span class="wc-mark" aria-hidden="true">◒</span> {{ t.scene }}</div>
          <div class="wc-switch" role="group" :aria-label="t.scene">
            <button v-for="key in ['day','night']" :key="key" type="button" :aria-pressed="mode===key" @click="mode=key">{{ t[key] }}</button>
          </div>
        </figcaption>
      </figure>
      <section class="wc-intent">
        <div><p class="wc-eyebrow">01 / OPEN PLAY</p><h2>{{ t.briefTitle }}</h2></div>
        <div><p>{{ t.brief }}</p><p class="wc-muted">{{ t.duskNote }}</p></div>
      </section>
      <figure class="wc-elevation">
        <button type="button" class="wc-photo-open" :aria-label="t.enlarge+' · '+t.elevation" @click="inspect('elevation.png',t.elevationAlt)">
          <img :src="path('elevation.png')" :alt="t.elevationAlt" loading="lazy" />
        </button>
        <figcaption><b>{{ t.archive }} / {{ t.elevation }}</b><span>{{ t.note }}</span></figcaption>
      </figure>
      <section class="wc-detail">
        <button type="button" class="wc-photo-open" :aria-label="t.enlarge+' · '+t.hoopTitle" @click="inspect('hoop.webp',t.hoopAlt)"><img :src="path('hoop.webp')" :alt="t.hoopAlt" loading="lazy" /></button>
        <div class="wc-caption"><p class="wc-eyebrow">02 / FORM</p><h2>{{ t.hoopTitle }}</h2><p>{{ t.hoopBody }}</p></div>
      </section>
      <section class="wc-detail wc-detail--reverse">
        <button type="button" class="wc-photo-open" :aria-label="t.enlarge+' · '+t.ballTitle" @click="inspect('storage.webp',t.ballAlt)"><img :src="path('storage.webp')" :alt="t.ballAlt" loading="lazy" /></button>
        <div class="wc-caption"><p class="wc-eyebrow">03 / IN HAND</p><h2>{{ t.ballTitle }}</h2><p>{{ t.ballBody }}</p></div>
      </section>
      <figure class="wc-pattern"><button type="button" class="wc-photo-open" :aria-label="t.enlarge+' · '+t.pattern" @click="inspect('pattern.webp',t.patternAlt)"><img :src="path('pattern.webp')" :alt="t.patternAlt" loading="lazy" /></button>
        <figcaption><p class="wc-eyebrow">{{ t.archive }} / 02</p><h3>{{ t.pattern }}</h3><p>{{ t.patternNote }}</p></figcaption>
      </figure>
      <footer class="wc-credit"><b>{{ t.status }}</b><p>{{ t.credits }}</p></footer>
      <dialog ref="viewer" class="wc-dialog" :aria-label="enlarged?.alt || t.scene" @click.self="$refs.viewer.close()" @close="enlarged=null">
        <template v-if="enlarged"><button type="button" autofocus @click="$refs.viewer.close()">{{ t.close }} ×</button><img :src="path(enlarged.file)" :alt="enlarged.alt" /></template>
      </dialog>
    </article>`
};
