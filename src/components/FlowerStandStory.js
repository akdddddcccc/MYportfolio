import '../styles/shaker-story.css';
import '../styles/flower-story.css';
import { flowerStorySizes, flowerStorySource } from '../data/flowerStoryAssets.js';

const photo = (file, zh, en, dark = false) => ({ file, caption: [zh, en], dark });
const FlowerPhoto = {
  props: ['item', 'zh'], emits: ['inspect'],
  computed: {
    source() { return flowerStorySource(this.item.file); },
    size() { return flowerStorySizes[this.item.file] || []; }
  },
  template: `<figure class="flower-photo" :class="{'flower-photo--dark':item.dark}">
    <button type="button" @click="$emit('inspect',item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item.caption[zh?0:1]">
      <img :src="source" :alt="item.caption[zh?0:1]" :width="size[0]" :height="size[1]" loading="lazy" decoding="async">
    </button>
    <figcaption>{{item.caption[zh?0:1]}}<span aria-hidden="true">↗</span></figcaption>
  </figure>`
};

export default {
  name: 'FlowerStandStory', components: { FlowerPhoto }, props: ['lang'],
  data() {
    return {
      step: 0, vectorVariant: 0, enlarged: null, opener: null,
      vectorVariants: [
        photo('window-vector-white', '素白层叠 · 原稿矢量构成', 'White layers · original vector composition', true),
        photo('window-vector-green', '青绿线构 · 原稿矢量构成', 'Green geometry · original vector composition')
      ],
      windows: [
        photo('window-01', '几何边框与交错直线', 'Geometric framing and intersecting lines'),
        photo('window-04', '海棠轮廓与重复单元', 'Begonia outlines and repeated units'),
        photo('window-05', '以框取景，虚实相生', 'Framing views through an opening'),
        photo('window-02', '光线穿过空间的层次', 'Light through layered space'),
        photo('window-03', '游廊中的连续节奏', 'A repeating rhythm along the corridor'),
        photo('window-06', '框景与园林的关系', 'Windows connecting interior and garden')
      ],
      moodboard: [
        photo('mood-geometric', '几何构成参考', 'Geometric composition reference'),
        photo('mood-bauhaus', '包豪斯海报参考', 'Bauhaus poster reference'),
        photo('mood-kandinsky', '抽象构成参考', 'Abstract composition reference'),
        photo('mood-chair-black', '几何家具参考', 'Geometric furniture reference'),
        photo('mood-chair-geometric', '折线与家具轮廓参考', 'Angular furniture reference'),
        photo('mood-form', '形式语言参考拼贴', 'Form-language reference collage', true)
      ],
      sketch: photo('sketch-elements', '从花窗到造型元素 · 原始推演草图', 'From windows to form · original sketch', true),
      sunWindows: photo('sun-window-reference', '原稿中的拟日纹参考', 'Sun-motif references from the source'),
      definition: photo('grasshopper-definition', 'Grasshopper 参数化路径 · 原始节点图', 'Grasshopper definition · original node graph'),
      motifs: [
        photo('motif-white', '拟日纹 · 原始浮雕形态研究', 'Sun motif · original relief study'),
        photo('motif-green-v2', '拟日纹 · 青绿釉面材质演绎', 'Sun motif · green-glaze visualization')
      ],
      processPhotos: [
        photo('process-laser', '激光雕刻 · 木板上的分层部件', 'Laser cutting · layered wooden parts'),
        photo('process-glue', '叠层粘合 · 组装纹样', 'Layered assembly · gluing the pattern'),
        photo('process-support', '支撑试验 · 观察结构关系', 'Support test · studying the structure'),
        photo('process-assembly', '平面造型完成 · 手持样件', 'Planar assembly · the hand-held prototype')
      ],
      wood: photo('prototype-wood', '木质原型 · 造型与层次的第一次实物验证', 'Wooden prototype · first physical form study'),
      render: photo('home-walnut-v2', '家居情境 · 胡桃木边柜上的花窗摆件', 'Home setting · a window ornament on a walnut sideboard'),
      prototypes: [
        photo('prototype-front', '3D 打印实物 · 正面', '3D-printed prototype · front'),
        photo('prototype-angle', '3D 打印实物 · 侧向层次', '3D-printed prototype · layered side view')
      ]
    };
  },
  computed: {
    zh() { return this.lang === 'zh'; },
    chapters() {
      return this.zh ? ['元素来源','参数推演','制作验证','方案呈现','实物反思']
        : ['Origins','Parametric study','Making','Concept','Reflection'];
    },
    elements() {
      return this.zh ? [
        ['海棠轮廓','保留花窗圆润、内收的外轮廓。'],
        ['交错直线','用直线、边角装饰建立几何秩序。'],
        ['中心对称','围绕中心组织重复单元与层次。'],
        ['拟日纹','将传统纹样转化为参数化的浮雕装饰。']
      ] : [
        ['Begonia outline','Rounded, inward-curving contours drawn from traditional windows.'],
        ['Intersecting lines','Straight lines and corner details establish geometric order.'],
        ['Central symmetry','Repeated units and layers arranged around a centre.'],
        ['Sun motif','Traditional ornament explored as a parametric relief.']
      ];
    },
    process() {
      return this.zh ? [
        ['激光雕刻','将图案导入 Rhino 整理为线稿，输出 DWG，利用学校的激光加工设备制作木板部件。'],
        ['叠层粘合','将分层部件逐层粘合。制作中发现木板过薄，在拆取和粘贴时容易断裂，材料需要重新考虑。'],
        ['支撑试验','反复调整尺寸并试验支撑关系，观察造型、连接与稳定性之间的矛盾。'],
        ['平面造型完成','木质样件完成了整体造型，但支撑效果与预期仍有差距，继续进入后续材料与结构验证。']
      ] : [
        ['Laser cutting','The artwork was traced in Rhino, exported as DWG and cut into wooden parts using the school workshop.'],
        ['Layered assembly','The layers were glued together. Thin wood broke during removal and assembly, prompting a material rethink.'],
        ['Support testing','Dimensions and support arrangements were tested repeatedly to examine form, connections and stability.'],
        ['Planar prototype','The wooden assembly established the form, but its support performance still fell short of expectations.']
      ];
    },
    findings() {
      return this.zh ? [
        ['材料偏软','原稿记录：3D 打印材料过于柔软，支撑性能不理想。'],
        ['结构与美观','多层纹样形成了丰富的视觉层次，但结构与美观还没有达到平衡。'],
        ['使用条件受限','对被支撑物的厚度和表面粗糙度有一定要求，需要进一步验证。']
      ] : [
        ['Material too soft','The original evaluation notes that the 3D-printing material was too flexible to provide reliable support.'],
        ['Form versus structure','The layered ornament created visual depth, but aesthetics and structural performance were not yet balanced.'],
        ['Limited use conditions','Support depended on the thickness and surface roughness of the object; further testing was needed.']
      ];
    }
  },
  methods: {
    t(v) { return v[this.zh ? 0 : 1]; },
    source(file) { return flowerStorySource(file); },
    go(i) {
      this.$el.querySelector('#flower-part-'+i)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    },
    open(item, event) {
      this.enlarged = item;
      this.opener = event.currentTarget;
      this.$nextTick(() => this.$refs.viewer.showModal());
    },
    close() { this.$refs.viewer.close(); },
    closed() { this.enlarged = null; this.opener?.focus({ preventScroll: true }); }
  },
  template: `
    <article class="shaker-story flower-story" :class="{'flower-story--en':!zh}" :aria-label="zh?'花架子设计过程':'Flower Stand design process'">
      <nav class="shaker-chapters flower-chapters" :aria-label="zh?'项目章节':'Project chapters'">
        <template v-for="(label,i) in chapters" :key="label">
          <button type="button" @click="go(i)"><span>0{{i+1}}</span>{{label}}</button>
          <button v-if="i===1" type="button" @click="go('vector')"><span aria-hidden="true">◈</span>{{zh?'矢量构成':'Vector study'}}</button>
        </template>
      </nav>

      <section id="flower-part-0" class="shaker-part">
        <header><small>PART 01 / PATTERNS IN THE GARDEN</small>
          <h2><template v-if="zh">从一扇花窗，<br>找到几何的秩序。</template><template v-else>Finding geometric order in a garden window.</template></h2>
          <p>{{zh?'这次探索从苏州园林的花窗出发：海棠轮廓、边角装饰与交错直线，在虚实相间的框景中形成秩序。将这些传统造型元素提取出来，再与参数化方法结合，尝试一件具有装饰性的桌面支架。':'The study begins with Suzhou garden windows: begonia outlines, corner details and intersecting lines create order through solid and void. These elements inform an ornamental desktop stand explored through parametric design.'}}</p>
        </header>
        <div class="flower-window-grid">
          <FlowerPhoto v-for="item in windows" :key="item.file" :item="item" :zh="zh" @inspect="open" />
        </div>
        <p class="flower-note">{{zh?'以上为原稿收集的园林参考图，用于说明灵感来源。':'Garden reference images collected in the original design study.'}}</p>
        <div class="flower-extraction">
          <FlowerPhoto :item="sketch" :zh="zh" @inspect="open" />
          <div class="flower-elements">
            <article v-for="(item,i) in elements" :key="i"><span>0{{i+1}}</span><div><h3>{{item[0]}}</h3><p>{{item[1]}}</p></div></article>
          </div>
        </div>
        <details class="flower-references">
          <summary>{{zh?'展开原稿中的形式与风格参考':'Explore the original form and style references'}}<span aria-hidden="true">＋</span></summary>
          <p class="flower-note">{{zh?'这些图片是原稿的参考拼贴，不是本项目的原创作品或最终产出。':'These collected references are not original work or final outputs of this project.'}}</p>
          <div class="flower-reference-grid">
            <FlowerPhoto v-for="item in moodboard" :key="item.file" :item="item" :zh="zh" @inspect="open" />
          </div>
        </details>
      </section>

      <section id="flower-part-1" class="shaker-part">
        <header><small>PART 02 / ORNAMENT × PARAMETRIC DESIGN</small>
          <h2><template v-if="zh">让参数服务于纹样，<br>而不是限制造型。</template><template v-else>Parameters in service of ornament.</template></h2>
          <p>{{zh?'原稿将拟日纹作为进一步推演的中心元素。与其让重复的数学规则决定整件产品，不如把参数化方法用于局部装饰：保留传统纹样的识别性，探索旋转、重复和层次带来的形态变化。':'The sun motif becomes the focus of the next study. Rather than allowing repeated mathematical rules to dictate the whole product, parametric methods develop an ornamental element through rotation, repetition and layering.'}}</p>
        </header>
        <div class="flower-motif-origin">
          <FlowerPhoto :item="sunWindows" :zh="zh" @inspect="open" />
          <div class="flower-motif-mark">
            <img src="/images/study/flower-story/sun-motif.svg" alt="" aria-hidden="true">
            <div><small>{{zh?'元素提炼':'MOTIF EXTRACTION'}}</small><h3>{{zh?'拟日纹':'Sun motif'}}</h3><p>{{zh?'中心、旋转、重复。':'Centre, rotation, repetition.'}}</p></div>
          </div>
        </div>
        <div class="flower-pair flower-motifs">
          <FlowerPhoto v-for="item in motifs" :key="item.file" :item="item" :zh="zh" @inspect="open" />
        </div>
        <div class="flower-definition">
          <FlowerPhoto :item="definition" :zh="zh" @inspect="open" />
          <p class="flower-note">{{zh?'原始 Grasshopper 节点图，保留生成逻辑与连线关系，可点击放大查看细节。':'The original Grasshopper node graph preserves the definition and its connections. Select the image to inspect the details.'}}</p>
        </div>
      </section>

      <section id="flower-part-vector" class="flower-vector" :aria-label="zh?'原稿矢量构成':'Original vector composition'">
        <button type="button" class="flower-vector-stage" :class="{'flower-vector-stage--green':vectorVariant===1}"
          @click="open(vectorVariants[vectorVariant],$event)" :aria-label="zh?'放大查看花窗矢量构成':'Enlarge the window vector composition'">
          <span class="flower-vector-index" aria-hidden="true">FIG. 0{{vectorVariant+1}} / VECTOR STUDY</span>
          <img :src="source(vectorVariants[vectorVariant].file)" :alt="t(vectorVariants[vectorVariant].caption)" width="460" height="460">
          <span class="flower-vector-zoom">{{zh?'放大细看':'Explore details'}} ↗</span>
        </button>
        <div class="flower-vector-copy">
          <small>FORM / LINE / LAYER</small>
          <h2>{{zh?'一扇花窗，':'A garden window,'}}<br>{{zh?'两种图形语言。':'two graphic expressions.'}}</h2>
          <p>{{zh?'圆弧、直线与中心纹样，在平面里交叠成一扇花窗。原稿中的两套矢量构成，一套用素白色块呈现层次，一套让青绿线条显出几何关系。':'Arcs, straight lines and a central motif overlap to form a window. Two original vector studies explore the same composition through pale layered shapes and green geometry.'}}</p>
          <div class="flower-vector-switch" role="group" :aria-label="zh?'切换矢量构成':'Switch vector composition'">
            <button type="button" :aria-pressed="vectorVariant===0" @click="vectorVariant=0">{{zh?'素白层叠':'White layers'}}</button>
            <button type="button" :aria-pressed="vectorVariant===1" @click="vectorVariant=1">{{zh?'青绿线构':'Green geometry'}}</button>
          </div>
          <span class="flower-vector-source">{{zh?'原稿 SVG · 放大依然清晰':'Original SVG · sharp at every scale'}}</span>
        </div>
      </section>

      <section id="flower-part-2" class="shaker-part">
        <header><small>PART 03 / FROM DRAWING TO MAKING</small>
          <h2><template v-if="zh">把屏幕里的层次，<br>放到手里验证。</template><template v-else>Testing the layers beyond the screen.</template></h2>
          <p>{{zh?'先通过激光切割和叠层粘合完成木质原型，再观察支撑方式与材料表现。制作过程既验证了造型，也暴露了薄板易断、支撑不足等问题。':'Laser-cut layers were assembled into a wooden prototype to test the form and support arrangement. Making confirmed the visual idea while exposing fragile parts and inadequate support.'}}</p>
        </header>
        <div class="flower-process-nav" role="group" :aria-label="zh?'选择制作阶段':'Select a making stage'">
          <button v-for="(item,i) in process" :key="i" type="button" :aria-pressed="step===i" :aria-controls="'flower-process-panel'" @click="step=i"><span>0{{i+1}}</span><strong>{{item[0]}}</strong></button>
        </div>
        <div id="flower-process-panel" class="flower-process-panel">
          <FlowerPhoto :item="processPhotos[step]" :zh="zh" @inspect="open" />
          <div class="flower-process-copy" aria-live="polite">
            <small>STEP 0{{step+1}} / 04</small><h3>{{process[step][0]}}</h3><p>{{process[step][1]}}</p>
            <span class="flower-note">{{zh?'点击上方节点，查看不同制作阶段。':'Select a node above to explore the making process.'}}</span>
          </div>
        </div>
        <div class="flower-wood"><FlowerPhoto :item="wood" :zh="zh" @inspect="open" /></div>
      </section>

      <section id="flower-part-3" class="shaker-part">
        <header><small>PART 04 / A WINDOW AT HOME</small>
          <h2><template v-if="zh">让一扇小花窗，<br>成为家里的一处风景。</template><template v-else>A small garden window becomes part of the home.</template></h2>
          <p>{{zh?'从支架原型延伸到家居陈设：把花窗放在边柜上，让自然侧光穿过圆弧与交错直线。暖白纹样、哑黑部件与木材相互衬托，展现层次、留白与日常尺度。':'From a stand prototype to a domestic ornament: natural side light passes through arcs and intersecting lines. Warm-white relief and satin-black details meet the grain of a wooden sideboard, bringing the layered form into everyday surroundings.'}}</p>
        </header>
        <div class="flower-scene"><FlowerPhoto :item="render" :zh="zh" @inspect="open" /></div>
        <p class="flower-note">{{zh?'本页家居场景及青绿纹样图基于原渲染进行 AI 辅助视觉优化，用于表现材质与陈设氛围；下方保留真实原型照片与制作反思。':'The home scenes and green motif are AI-assisted refinements of the original renders, exploring finish and setting. Actual prototype photographs and findings remain below.'}}</p>
      </section>

      <section id="flower-part-4" class="shaker-part">
        <header><small>PART 05 / PROTOTYPE & REFLECTION</small>
          <h2><template v-if="zh">有了形，<br>还需要可靠的支撑。</template><template v-else>A resolved form still needs reliable support.</template></h2>
          <p>{{zh?'3D 打印实物进一步呈现了纹样和层次，也让问题变得更具体。这次探索完成了从传统元素到参数化造型的尝试，但材料与支撑结构仍有待改进。':'The 3D-printed prototype made the ornament and its layers tangible, while revealing practical limitations. The exploration connects traditional elements with parametric form, but materials and support still need refinement.'}}</p>
        </header>
        <div class="flower-pair flower-prototypes"><FlowerPhoto v-for="item in prototypes" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
        <div class="flower-findings"><article v-for="(item,i) in findings" :key="i"><small>0{{i+1}}</small><h3>{{item[0]}}</h3><p>{{item[1]}}</p></article></div>
        <p class="flower-note flower-ending">{{zh?'继续向下，可体验原有的产品点云展示。':'Continue below to explore the original point-cloud view.'}}</p>
      </section>

      <dialog ref="viewer" class="flower-viewer" :class="{'flower-viewer--dark':enlarged?.dark}" :aria-label="zh?'原图查看':'Image viewer'" @click.self="close" @close="closed">
        <button type="button" class="flower-viewer-close" @click="close" :aria-label="zh?'关闭图片':'Close image'">×</button>
        <figure v-if="enlarged"><img :src="source(enlarged.file)" :alt="t(enlarged.caption)"><figcaption>{{t(enlarged.caption)}}</figcaption></figure>
      </dialog>
    </article>`
};
