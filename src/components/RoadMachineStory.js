import '../styles/shaker-story.css';
import '../styles/road-story.css';
import sourceManifest from '../../images/work/road-story/source-manifest.json';

const asset = (file, zh, en, dark = false) => ({ file, caption: [zh, en], dark });
const src = file => '/images/work/road-story/' + sourceManifest.assets[file].file;
const RoadPhoto = {
  props: ['item', 'zh'], emits: ['inspect'],
  computed: { info() { return sourceManifest.assets[this.item.file]; } },
  methods: { src },
  template: `<figure class="road-photo" :class="{'road-photo--dark':item.dark}">
    <button type="button" @click="$emit('inspect',item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item.caption[zh?0:1]">
      <img :src="src(item.file)" :alt="item.caption[zh?0:1]" :width="info.size?.[0]" :height="info.size?.[1]" loading="lazy" decoding="async">
    </button>
    <figcaption>{{item.caption[zh?0:1]}}<span aria-hidden="true">↗</span></figcaption>
  </figure>`
};

export default {
  name: 'RoadMachineStory', props: ['lang'], components: { RoadPhoto },
  data() {
    return {
      direction: 0, enlarged: null, opener: null,
      directions: [
        { title: ['直接提取','Direct extraction'], description: ['从原标志中提取轮廓，整理为更明确的几何关系，尝试让品牌形象与硬件表面形成统一的秩序。','Extracting and regularising the original silhouette to explore a more coherent relationship with the hardware.'],
          drawing: asset('direct-construction','方向一 · 轮廓提取与构造线','Direction 1 · outline and construction'),
          logos: [asset('direct-brand','方向一 · 标志组合','Direction 1 · brand lockup')],
          application: asset('direct-application','方向一 · 原产品上的标志应用试排','Direction 1 · application study on the original product') },
        { title: ['汉字「鼎」','The character 鼎'], description: ['将「鼎」的字形作为识别核心，通过对称与笔画组织，把器物联想转译成可用于品牌的图形。','Using the Chinese character for ding as the core mark, exploring symmetry and strokes as a bridge between the vessel and the brand.'],
          drawing: asset('character-construction','方向二 · 字形构造线','Direction 2 · character construction'),
          logos: [asset('character-brand','方向二 · 标志组合','Direction 2 · brand lockup')],
          application: asset('character-application','方向二 · 原产品上的标志应用试排','Direction 2 · application study on the original product') },
        { title: ['印章','Seal'], description: ['借用印章的边界与字形关系，测试更紧凑的正负形。原稿保留两种组合方式，在同一方向下比较视觉重心。','A compact seal explores the relationship between boundary, character and negative space. Two original lockups compare the visual balance.'],
          drawing: asset('seal-construction','方向三 · 印章正负形推演','Direction 3 · seal construction'),
          logos: [asset('seal-brand','方向三 · 标志组合 A','Direction 3 · lockup A'),asset('seal-brand-alt','方向三 · 标志组合 B','Direction 3 · lockup B')],
          application: asset('seal-application','方向三 · 原产品上的标志应用试排','Direction 3 · application study on the original product') }
      ],
      references: [
        asset('reference-tesla','原稿参考 · Tesla','Source reference · Tesla'),
        asset('reference-huawei','原稿参考 · Huawei','Source reference · Huawei'),
        asset('reference-marks','原稿参考 · 品牌标志的几何秩序','Source reference · geometry in brand marks'),
        asset('reference-yangwang','原稿参考 · 仰望的传统符号转译','Source reference · traditional symbols in Yangwang')
      ],
      traditional: [
        asset('reference-handle','器耳造型参考','Vessel-handle reference'),
        asset('reference-mask','兽面纹参考','Animal-mask reference'),
        asset('reference-ding','青铜器纹样参考','Bronze-vessel reference'),
        asset('reference-mask-line','兽面纹线条参考','Animal-mask linework reference'),
        asset('reference-base','连续纹理参考','Repeating-pattern reference')
      ],
      original: asset('original-product','原产品记录 · 原图仅 186 × 400 px','Original product record · source 186 × 400 px'),
      drawing: asset('technical-drawing','结构线稿 · 原稿完整 SVG','Technical linework · complete original SVG'),
      process: [
        asset('model-outline','原始造型线稿 · 完整产品轮廓','Original form sketch · complete product outline'),
        asset('model-workspace','Rhino 建模过程 · 原始工作界面','Rhino modelling · original workspace'),
        asset('pattern-workspace','Illustrator 纹样整理 · 原始工作界面','Illustrator pattern development · original workspace')
      ],
      render: asset('render-on','改良方案 · 开机状态的整体形态','Concept rendering · overall form with screens on'),
      details: [
        asset('render-top','器耳与顶部：轮廓的延续','Handles and top · continuity of the silhouette'),
        asset('render-upper','上部操作面板：兽面纹与功能部件','Upper panel · ornament and functional parts'),
        asset('render-lower','下部操作面板：规整的界面关系','Lower panel · a more ordered arrangement')
      ],
      motifs: [
        asset('motif-top','鼎上边沿纹饰','Upper-rim ornament',true),
        asset('motif-mask','鼎正面兽面纹','Front animal-mask ornament',true),
        asset('motif-base','底座抽象纹理','Abstract base pattern',true)
      ]
    };
  },
  computed: {
    zh() { return this.lang === 'zh'; },
    current() { return this.directions[this.direction]; },
    chapters() { return this.zh ? ['品牌辨识','三种方向','产品迭代','纹样与呈现'] : ['Brand review','Three directions','Product iteration','Ornament & form']; },
    changes() {
      return this.zh ? [
        ['器耳重新设计','从传统器物的器耳轮廓出发，重新整理顶部及侧向造型。'],
        ['加入兽纹','把兽面纹放入操作面板，连接品牌语义与器物意象。'],
        ['花纹细节整体化','让顶部、面板和底座的装饰关系形成一套系统。'],
        ['界面重设计','以更规整的边界组织显示区与操作区，探索视觉层级。'],
        ['上下操作口的连续性','回应原产品上下收发卡区域割裂的问题，尝试统一面板语言。']
      ] : [
        ['Redesign the handles','Revisit the top and side silhouette through references to traditional vessel handles.'],
        ['Introduce animal-mask ornament','Connect the operating panels with the vessel imagery behind the brand.'],
        ['Unify decorative details','Treat the top, panels and base as parts of one visual system.'],
        ['Reorganise the interface','Explore a clearer hierarchy through more regular display and control boundaries.'],
        ['Connect upper and lower panels','Address the visual separation of the two card-handling areas with a shared panel language.']
      ];
    }
  },
  methods: {
    src, t(v) { return v[this.zh ? 0 : 1]; },
    go(i) { this.$el.querySelector('#road-part-'+i)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); },
    open(item,event) { this.enlarged=item;this.opener=event.currentTarget;this.$nextTick(()=>this.$refs.viewer.showModal()); },
    close() { this.$refs.viewer.close(); },
    closed() { this.enlarged=null;this.opener?.focus({preventScroll:true}); }
  },
  template: `<article class="shaker-story road-story" :class="{'road-story--en':!zh}" :aria-label="zh?'道路机设计过程':'Road machine design process'">
    <nav class="shaker-chapters" :aria-label="zh?'项目章节':'Project chapters'">
      <button v-for="(label,i) in chapters" :key="i" type="button" @click="go(i)"><small>0{{i+1}}</small>{{label}}</button>
    </nav>
    <section id="road-part-0" class="shaker-part">
      <header><small>PART 01 / FROM IDENTITY TO HARDWARE</small>
        <h2>{{zh?'从一个「鼎」字，':'From a single character,'}}<br>{{zh?'重新看一台道路机。':'to a hardware identity.'}}</h2>
        <p>{{zh?'这不是一次从零开始的产品设计，而是围绕既有道路收发卡机展开的改良探索：先观察品牌标志与硬件形态的关系，再将传统器物的造型、纹样与功能面板放到同一套视觉语言中。':'An improvement study of an existing road card transceiver, not a ground-up product design. The exploration connects brand identity, vessel-inspired form, ornament and operating panels.'}}</p>
      </header>
      <div class="road-brand-review">
        <figure class="road-original-brand"><div class="road-brand-lockup">
          <img class="road-brand-symbol" :src="src('brand-symbol')" :alt="zh?'原品牌鼎形标志':'Original brand symbol'">
          <div><img :src="src('brand-chinese')" alt="中天中鼎"><img :src="src('brand-english')" alt="ZHONG TIAN ZHONG DING"></div>
        </div><figcaption>{{zh?'原品牌标志 · 保留原稿矢量':'Original brand identity · source vectors'}}</figcaption></figure>
        <div class="road-review-copy"><article><small>01 / {{zh?'保留识别':'RECOGNITION'}}</small><h3>{{zh?'保留传统语义与视觉张力':'Retain its traditional character'}}</h3><p>{{zh?'原稿认为，不规则轮廓在平面印刷中具有鲜明的视觉张力。改良的出发点，是保留识别而非完全替换。':'The source notes the expressive character of the irregular mark in print. The study aims to preserve recognition rather than replace it entirely.'}}</p></article>
          <article><small>02 / {{zh?'适配硬件':'HARDWARE FIT'}}</small><h3>{{zh?'让标志进入产品的秩序':'Bring the mark into the product'}}</h3><p>{{zh?'围绕边界、笔画与色彩展开调整，尝试缓解复杂标志与规整硬件表面之间的不协调。':'Boundary, stroke and colour studies explore a better relationship between the intricate mark and the regular hardware surface.'}}</p></article></div>
      </div>
      <div class="road-palette"><div><h3>{{zh?'颜色，也需要落到材料上。':'Colour needs a material context.'}}</h3><p>{{zh?'原稿记录了屏幕与实物的色差，并提出降低鲜艳度、关注印刷色彩的方向。下方保留原稿明确标注的两个色值；实际应用仍需打样校色。':'The source notes a screen-to-product colour mismatch and proposes less saturated print colours. These are the explicitly labelled source values; production still requires physical colour matching.'}}</p></div>
        <div class="road-swatch" style="--swatch:#d54b44"><span></span><strong>{{zh?'榴花红':'Pomegranate red'}}</strong><code>#D54B44</code></div>
        <div class="road-swatch" style="--swatch:#312520"><span></span><strong>{{zh?'煤黑':'Coal black'}}</strong><code>#312520</code></div>
      </div>
      <details class="road-fold"><summary>{{zh?'查看原稿中的品牌参考':'View the original brand references'}}<span>＋</span></summary>
        <p class="road-note">{{zh?'以下为原稿收集的研究参考，不是本项目的原创标志。':'Collected research references, not original marks designed for this project.'}}</p>
        <div class="road-reference-grid"><RoadPhoto v-for="item in references" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
      </details>
    </section>
    <section id="road-part-1" class="shaker-part">
      <header><small>PART 02 / THREE BRAND DIRECTIONS</small><h2>{{zh?'同一个起点，':'One starting point,'}}<br>{{zh?'三种形的可能。':'three formal directions.'}}</h2><p>{{zh?'直接提取、汉字「鼎」、印章：三个方向分别从轮廓、字形和边界出发。构造线、标志组合及产品试排一并保留，便于比较，而不是把不同方案混成一个最终结果。':'Three directions explore silhouette, character and seal. Construction lines, brand lockups and application studies remain together so that the alternatives can be compared without implying a single approved result.'}}</p></header>
      <div class="road-direction-tabs" role="group" :aria-label="zh?'标志方向':'Brand direction'">
        <button v-for="(item,i) in directions" :key="i" type="button" :aria-pressed="direction===i" aria-controls="road-direction-panel" @click="direction=i"><small>0{{i+1}}</small>{{t(item.title)}}</button>
      </div>
      <div id="road-direction-panel" class="road-direction-panel">
        <div class="road-direction-construction"><RoadPhoto :item="current.drawing" :zh="zh" @inspect="open"/><p>{{t(current.description)}}</p></div>
        <div class="road-direction-lockups"><RoadPhoto v-for="item in current.logos" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
        <div class="road-direction-application"><RoadPhoto :item="current.application" :zh="zh" @inspect="open"/></div>
      </div>
    </section>
    <section id="road-part-2" class="shaker-part">
      <header><small>PART 03 / PRODUCT ITERATION</small><h2>{{zh?'从局部装饰，':'From separate details,'}}<br>{{zh?'走向整体关系。':'towards a coherent whole.'}}</h2><p>{{zh?'原稿提出五个改良切口，既关注传统元素，也关注上下操作区域的视觉连续性。下面将原有标注拆成真实文字，保留问题与设计动作之间的对应。':'Five original improvement points connect traditional references with the continuity of the upper and lower operating areas. The source annotations are presented as readable text.'}}</p></header>
      <div class="road-improvements"><div class="road-original-product"><RoadPhoto :item="original" :zh="zh" @inspect="open"/><p class="road-note">{{zh?'历史资料清晰度有限，保留原图，不伪造产品细节。':'The archival source is low-resolution; its details have not been invented or regenerated.'}}</p></div>
        <ol class="road-change-list"><li v-for="(item,i) in changes" :key="i"><span>0{{i+1}}</span><div><h3>{{item[0]}}</h3><p>{{item[1]}}</p></div></li></ol>
      </div>
      <details class="road-fold"><summary>{{zh?'展开器物与纹样的来源参考':'Explore the vessel and ornament references'}}<span>＋</span></summary>
        <div class="road-traditional-grid"><RoadPhoto v-for="item in traditional" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
      </details>
      <div class="road-structure"><RoadPhoto :item="drawing" :zh="zh" @inspect="open"/><div><small>FORM / PROPORTION / PANEL</small><h3>{{zh?'先整理轮廓，再落入三维。':'Resolve the outline, then move into 3D.'}}</h3><p>{{zh?'原稿中的结构线稿完整提取为 SVG，保留正面与侧面的线条。配合 Rhino 建模，观察器耳、屏幕、操作面板与底座之间的比例和连接关系。':'The complete original linework is retained as SVG, including front and side views. Rhino modelling explores the proportions and connections between handles, screens, panels and base.'}}</p></div></div>
      <details class="road-fold"><summary>{{zh?'查看原始建模与图案制作过程':'View the original modelling and pattern process'}}<span>＋</span></summary>
        <div class="road-process-grid"><RoadPhoto v-for="item in process" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
      </details>
    </section>
    <section id="road-part-3" class="shaker-part">
      <header><small>PART 04 / ORNAMENT MEETS FUNCTION</small><h2>{{zh?'纹样不是贴花，':'Ornament as a system,'}}<br>{{zh?'而是一套贯穿的语言。':'not a separate layer.'}}</h2><p>{{zh?'顶部边沿、正面兽面纹、底座抽象纹理，分别对应不同尺度和位置。把平面纹样与产品细节并列呈现，让从传统器物到硬件形态的转换看得见。':'Upper-rim ornament, a frontal animal mask and an abstract base pattern work at different scales and positions. Flat patterns and product details reveal the translation from traditional vessels to hardware.'}}</p></header>
      <div class="road-patterns"><RoadPhoto v-for="item in motifs" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
      <div class="road-result"><RoadPhoto :item="render" :zh="zh" @inspect="open"/><div class="road-result-copy"><small>CONCEPT / VISUAL STUDY</small><h3>{{zh?'品牌、形态、面板，放回同一台产品。':'Identity, form and panels, back in one product.'}}</h3><p>{{zh?'蓝色机身、金属面板和传统纹样共同构成这一轮改良方案。这里展示的是原稿中的概念渲染与造型探索；不将其描述为已量产或已验证的使用结果。':'The blue body, metal panels and traditional motifs form this iteration. These are original concept renders and form studies, not claims of production or validated usability.'}}</p></div></div>
      <div class="road-detail-grid"><RoadPhoto v-for="item in details" :key="item.file" :item="item" :zh="zh" @inspect="open"/></div>
      <p class="road-note">{{zh?'继续向下，可旋转查看原有的产品点云。所有标志与纹样均来自原稿；白色纹样使用深灰底，以保证细节可见。':'Continue below for the original interactive point cloud. All marks and motifs come from the source; white patterns are shown on charcoal for legibility.'}}</p>
    </section>
    <dialog ref="viewer" class="road-viewer" :class="{'road-viewer--dark':enlarged?.dark}" :aria-label="zh?'素材查看':'Asset viewer'" @click.self="close" @close="closed">
      <button type="button" class="road-viewer-close" @click="close" :aria-label="zh?'关闭图片':'Close image'">×</button>
      <figure v-if="enlarged"><img :src="src(enlarged.file)" :alt="t(enlarged.caption)"><figcaption>{{t(enlarged.caption)}}<a :href="src(enlarged.file)" target="_blank" rel="noopener">{{zh?'查看独立原图':'Open image'}} ↗</a></figcaption></figure>
    </dialog>
  </article>`
};
