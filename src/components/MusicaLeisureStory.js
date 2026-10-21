import '../styles/shaker-story.css';
import '../styles/leisure-story.css';
import { leisureImageSizes } from '../data/leisureImageSizes.js';
import { leisureRenderAssets, leisurePhotoSource } from '../data/leisureRenderAssets.js';

const photo = (file, zh, en, dark = false) => ({ file, caption: [zh, en], dark });
const LeisurePhoto = {
  props: ['item', 'zh'], emits: ['inspect'],
  computed: {
    source() { return leisurePhotoSource(this.item.file); },
    size() { return leisureRenderAssets[this.item.file]?.size || leisureImageSizes[this.item.file] || []; }
  },
  template: `<figure class="leisure-photo" :class="{'leisure-photo--dark': item.dark}">
    <button type="button" @click="$emit('inspect',item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item.caption[zh?0:1]">
      <img :src="source" :alt="item.caption[zh?0:1]" :width="size[0]" :height="size[1]" loading="lazy" decoding="async">
    </button><figcaption>{{item.caption[zh?0:1]}}<span aria-hidden="true">↗</span></figcaption>
  </figure>`
};

export default {
  name: 'MusicaLeisureStory', components: { LeisurePhoto }, props: ['lang'],
  data() {
    return {
      enlarged: null, opener: null, mode: 0,
      forms: [
        photo('966-imgDcim41', '从独处到共享的早期构想', 'Early ideas for private and shared listening', true),
        photo('966-img3A17Ee2Abed8D53B2C336619940D42801', '螺旋围合与透明表皮', 'Helical enclosure and transparent skin', true),
        photo('966-imgB65A3342402971Aed009348B7E9Be7301', '围合方式与形态变体', 'Enclosure and form variations', true)
      ],
      models: [
        photo('966-imgImg20220605224748', '纸模 · 正面', 'Paper model · front'),
        photo('966-imgImg20220605224759', '纸模 · 侧面', 'Paper model · side'),
        photo('966-imgImg20220605225119', '纸模 · 内部围合', 'Paper model · enclosure'),
        photo('966-imgImg20220605225223', '纸模 · 展开关系', 'Paper model · opening')
      ],
      development: [
        photo('1156-imgDcim61', '使用情境草图', 'Use scenario sketch'),
        photo('1156-img65Z4I09G4FEjpfJ1', '内部空间与工作台草图', 'Interior and workstation study'),
        photo('1156-img9E3A7Ff4D4794Ea6B77B2B9574C4E69B1', '从骨架、支撑到外部光带', 'Skeleton, support and exterior light')
      ],
      spatial: [
        photo('1156-imgImage123', '螺旋主体与地台', 'Helical volume and platform'),
        photo('1156-img165640649173591', '平面分区 · 室内／公演／观众互动', 'Plan · interior / performance / audience'),
        photo('1156-img165640972971802', '侧向轮廓与透光地台', 'Side profile and translucent platform'),
        photo('1156-imgCQlcwA0VdbErryy1N1', '骨架与地台的连续结构', 'Continuous frame and platform'),
        photo('1156-imgOh917RUQBDhP68Pw1', '入口与旋转门结构构想', 'Entrance and pivoting-door concept'),
        photo('1156-img16564803898452', '灯光在地台上的延伸', 'Light extending across the platform', true)
      ],
      modes: [
        photo('1156-imgUntitled7', '室内演奏 · 保留一定私密性', 'Indoor performance · a degree of privacy', true),
        photo('1156-imgUntitled6', '内外分享 · 调整可见程度', 'Sharing · adjustable visibility', true),
        photo('1156-img61', '露天 LIVE · 演出与观众位置示意', 'Outdoor live · performers and audience study', true)
      ],
      gallery: [
        photo('1292-imgImage183', '最终方案 · 外部整体效果', 'Final concept · exterior', true),
        photo('1293-imgUntitled9', '整体俯视 · 螺旋空间与光阶', 'Overhead view · enclosure and illuminated steps', true),
        photo('1294-imgUntitled4', '内部工作台与设备布置', 'Interior workstation and equipment'),
        photo('1287-imgUntitled11', 'DNA 元素延续到桌椅与支撑', 'DNA-inspired furniture and supports')
      ]
    };
  },
  computed: {
    zh() { return this.lang === 'zh'; },
    chapters() { return this.zh ? ['使用需求','形态推演','空间结构','内外互动','效果展示'] : ['Needs','Form studies','Spatial structure','Interaction','Gallery']; },
    needs() { return this.zh ? [
      ['一个能安心听音乐的地方','从日常耳机聆听中抽离出来，为个人、小群体提供有一定私密性的音乐空间。'],
      ['让分享发生，而非强迫参与','音乐爱好者可以发起交流，朋友可以陪同，路过的人也能选择停留或离开。'],
      ['把表演与观众连接起来','从室内练习、半开放分享延伸到露天演出，让声音、视线和灯光共同参与。']
    ] : [
      ['A place to listen','A dedicated space for individuals and small groups, with a degree of privacy beyond everyday headphone listening.'],
      ['Invitation, not obligation','Enthusiasts can initiate a session, friends can join, and passers-by can choose whether to stay.'],
      ['Connecting performers and audiences','The concept spans indoor practice, shared listening and outdoor performances through sound, visibility and light.']
    ]; },
    interaction() { return this.zh ? [
      ['01','音乐工作台','交互屏承载音乐合成与演奏后期软件，麦克风和合成器配合内部工作台布置。'],
      ['02','音乐可视化','用实时图形呈现音乐变化，让使用者更直观地感受声音。'],
      ['03','弹幕互动墙','外部观众通过小程序发送反馈，演奏者据此决定是否调整玻璃透明度。'],
      ['04','观众热度与光','原方案设想通过人群计数反馈观众热度，改变透明地台下的灯光亮度与范围。']
    ] : [
      ['01','Music workstation','A screen supports music production and performance software alongside a microphone and synthesizer.'],
      ['02','Music visualisation','Real-time graphics make changes in sound more tangible to the users.'],
      ['03','Audience feedback','An audience mini-app sends comments to the performer, who can decide whether to change the glass transparency.'],
      ['04','Audience and light','The proposal uses crowd estimates to inform the brightness and reach of light beneath the translucent platform.']
    ]; }
  },
  methods: {
    imageSource(file) { return leisurePhotoSource(file); },
    t(v) { return v[this.zh ? 0 : 1]; },
    go(i) { this.$el.querySelector('#leisure-part-'+i)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); },
    open(item,event) { this.enlarged=item; this.opener=event.currentTarget; this.$nextTick(() => this.$refs.viewer.showModal()); },
    close() { this.$refs.viewer.close(); this.enlarged=null; this.opener?.focus(); }
  },
  template: `<section class="shaker-story leisure-story" :aria-label="zh?'乐憩设计过程':'Musica Leisure design story'">
    <nav class="shaker-chapters" :aria-label="zh?'项目章节':'Project chapters'"><button v-for="(chapter,i) in chapters" :key="chapter" @click="go(i)"><small>0{{i+1}}</small>{{chapter}}</button></nav>
    <section id="leisure-part-0" class="shaker-part">
      <header><small>PART 01 / LISTEN TOGETHER</small><h2>{{zh?'让音乐，成为相遇的理由。':'Music as a reason to meet.'}}</h2><p>{{zh?'项目从疫情封校时期的校园生活出发，关注表演者与听众两种参与方式。它不是简单地把音乐放到室外，而是在独处、陪伴与公共表达之间寻找一个可调节的空间。':'Beginning with campus life during pandemic restrictions, the project considers performers and listeners together. Rather than simply playing music outdoors, it explores an adjustable space between solitude, companionship and public expression.'}}</p></header>
      <div class="leisure-needs"><article v-for="(need,i) in needs" :key="i"><small>0{{i+1}}</small><h3>{{need[0]}}</h3><p>{{need[1]}}</p></article></div>
      <div class="leisure-research"><div><small>{{zh?'原稿问卷 / 对音乐的喜爱程度':'ORIGINAL SURVEY / INTEREST IN MUSIC'}}</small><div class="leisure-stats"><div v-for="row in (zh?[['很喜欢','62.26%'],['喜欢','35.85%'],['一般','1.89%']]:[['Very interested','62.26%'],['Interested','35.85%'],['Neutral','1.89%']])" :key="row[0]"><strong>{{row[1]}}</strong><span>{{row[0]}}</span></div></div><p class="leisure-note">{{zh?'原稿另记录“不喜欢”为 0%；未注明样本量。这里保留原始结果，不作总体推断。':'The original also records 0% for “not interested”; sample size is not specified. These are the original survey results, not population estimates.'}}</p></div><blockquote><p>“{{zh?'听什么不重要，在一起的人很重要。':'What we listen to matters less than who we are with.'}}”</p><cite>{{zh?'原稿用户访谈 · 普通音乐听众':'Original interview · casual listener'}}</cite></blockquote></div>
    </section>
    <section id="leisure-part-1" class="shaker-part">
      <header><small>PART 02 / A HELICAL ENCLOSURE</small><h2>{{zh?'用螺旋，连接开放与围合。':'A helix between open and enclosed.'}}</h2><p>{{zh?'草图从圆形围合、透明表皮和灯光关系展开，再用纸模推敲空间的开口与层次。最终将 DNA 式的交叉结构延伸到骨架、地台和内部家具。':'Sketches explore circular enclosures, transparent surfaces and lighting. Paper models test openings and spatial layers, leading to a DNA-like crossing structure that continues through the frame, platform and furniture.'}}</p></header>
      <div class="leisure-grid leisure-grid--three"><LeisurePhoto v-for="item in forms" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
      <h3 class="leisure-subtitle">{{zh?'从纸模，观察空间的内外。':'Studying the inside and outside through paper.'}}</h3>
      <div class="leisure-grid leisure-grid--models"><LeisurePhoto v-for="item in models" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
      <h3 class="leisure-subtitle">{{zh?'把使用方式，带回造型推演。':'Bringing use back into the form.'}}</h3>
      <div class="leisure-grid leisure-grid--development"><LeisurePhoto v-for="item in development" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
    </section>
    <section id="leisure-part-2" class="shaker-part">
      <header><small>PART 03 / SPATIAL STRUCTURE</small><h2>{{zh?'从一个人的室内，到一群人的现场。':'From an individual space to a shared stage.'}}</h2><p>{{zh?'方案划分为室内区、公演区和观众互动区。螺旋主体形成围合，透光地台向室外延伸，让结构、动线和灯光成为同一个空间系统。':'The proposal separates the interior, performance area and audience zone. A helical volume creates enclosure while a translucent platform extends outdoors, connecting structure, movement and light.'}}</p></header>
      <div class="leisure-zones"><span>01 {{zh?'室内区':'Interior'}}</span><span>02 {{zh?'公演区':'Performance'}}</span><span>03 {{zh?'观众互动区':'Audience'}}</span></div>
      <div class="leisure-grid"><LeisurePhoto v-for="item in spatial" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
      <p class="leisure-note">{{zh?'以上为原稿中的结构与功能构想，保留原图比例；不代表经过施工或生产验证。':'These are the original structural and functional studies, shown at their original proportions; they are not construction- or production-validated drawings.'}}</p>
    </section>
    <section id="leisure-part-3" class="shaker-part">
      <header><small>PART 04 / INSIDE ↔ OUTSIDE</small><h2>{{zh?'声音、视线与灯光，一起回应参与。':'Sound, visibility and light respond together.'}}</h2><p>{{zh?'透明度由使用者选择，音乐通过室内录制与外部播放建立联系；观众也可以通过反馈参与。下方切换展示原稿的三种场景，不是已部署的智能控制系统。':'Users choose the degree of visibility. Indoor audio capture and outdoor playback connect the two sides, while audience feedback adds another channel. The views below present three concept scenarios, not a deployed control system.'}}</p></header>
      <div class="leisure-modes" role="group" :aria-label="zh?'查看概念场景':'Concept scenarios'"><button v-for="(item,i) in modes" :key="item.file" :aria-pressed="mode===i" @click="mode=i">{{['01','02','03'][i]}} {{(zh?['室内演奏','内外分享','露天 LIVE']:['Indoor','Sharing','Outdoor live'])[i]}}</button></div>
      <div class="leisure-mode-stage"><LeisurePhoto :item="modes[mode]" :zh="zh" @inspect="open" /></div>
      <div class="leisure-interaction"><article v-for="row in interaction" :key="row[0]"><small>{{row[0]}}</small><div><h3>{{row[1]}}</h3><p>{{row[2]}}</p></div></article></div>
    </section>
    <section id="leisure-part-4" class="shaker-part">
      <header><small>PART 05 / MUSIC IN SPACE</small><h2>{{zh?'让音乐的氛围，成为空间的一部分。':'Making musical atmosphere part of the space.'}}</h2><p>{{zh?'外部光阶将演奏的氛围延展到观众一侧；内部桌椅延续交叉结构，工作台兼顾设备与随身物品的放置。':'Illuminated steps extend the atmosphere towards the audience. Inside, crossed structures shape the furniture and make room for equipment and belongings.'}}</p><p class="leisure-note">{{zh?'材质与环境效果以原设计为基础进行 AI 辅助优化，用于概念表达；结构关系以原始设计图为准。':'Materials and environments are AI-assisted visual refinements of the original design. These are concept images; refer to the original drawings for structural details.'}}</p></header>
      <div class="leisure-grid leisure-grid--gallery"><LeisurePhoto v-for="item in gallery" :key="item.file" :item="item" :zh="zh" @inspect="open" /></div>
    </section>
    <dialog ref="viewer" class="shaker-viewer leisure-viewer" :class="{'leisure-viewer--dark':enlarged?.dark}" :aria-label="zh?'设计图片放大':'Design image viewer'" @cancel.prevent="close" @click="($event.target===$refs.viewer)&&close()"><button class="shaker-viewer-close" @click="close">{{zh?'关闭':'Close'}} ×</button><template v-if="enlarged"><img :src="imageSource(enlarged.file)" :alt="t(enlarged.caption)"><p>{{t(enlarged.caption)}}</p></template></dialog>
  </section>`
};
