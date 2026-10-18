import '../styles/shaker-story.css';
import '../styles/music-table-story.css';
const root='/images/study/music-story/';
export default {
  name:'MusicTableStory', props:['lang'],
  data(){return {angle:0,enlarged:null,opener:null};},
  computed:{
    zh(){return this.lang==='zh';},
    chapters(){return this.zh?['设计出发点','曲线造型','尺寸与建模','音乐与灯光','产品展示']:['Intent','Form','Model','Music & light','Gallery'];},
    parts(){return [
      {title:['让家具，多一种陪伴。','A side table with another kind of presence.'],text:['乐几把置物、音乐与光结合，探索家具在日常生活中的情感价值。原方案面向重视审美与功能的年轻居住者，让边几不只承担收纳，也成为居家氛围的一部分。','Music, light and everyday storage meet in a furniture concept for young residents who value both function and expression. The table explores how furniture can contribute to the emotional atmosphere of a home.'],images:[['p2-0','家居氛围参考 · 非本项目设计','Interior mood reference · not this project']]},
      {title:['从曲线中，找到音乐的节奏。','Finding rhythm in a continuous curve.'],text:['参考简约家具的几何关系，并借鉴随身听机身曲线的律动感。草图从不同的支撑、围合和置物方式展开，逐步形成连续弯折、内外贯通的体量。','Geometric furniture references and the flowing contours of portable music players inform the form. Sketches explore support, enclosure and storage before converging on a continuous folded volume.'],images:[['p3-1','早期形态探索','Early form studies'],['p3-0','曲面与体量推演','Surface and volume studies'],['p3-4','几何家具参考','Geometric furniture reference'],['p3-2','连续曲面家具参考','Continuous-surface furniture reference']]},
      {title:['把曲线，落实为空间尺度。','Turning curves into spatial dimensions.'],text:['原稿用工程视图明确整体尺度，并在 Rhino 中推进连续曲面的建模。下方保留尺寸图与建模过程；这里展示的是概念方案，不代表已验证的生产结构。','Orthographic drawings define the overall scale, while Rhino studies develop the continuous surfaces. These drawings document a concept proposal rather than a validated production structure.'],images:[['dimensions','原稿尺寸图 · 单位 cm','Original dimensions · cm'],['p4-0','Rhino 曲面建模过程','Rhino surface modelling']]},
      {title:['置物之外，是音乐与光。','Beyond storage: music and light.'],text:['原方案将触摸控制、扬声器与灯光结合。触摸区域呈现播放控制，曲面与内部空间承载光的变化，让听音乐与边几的日常使用发生联系。以下为原始功能构想与效果渲染。','The proposal combines touch controls, speakers and lighting. Playback controls appear on the surface, while the curved form and interior space carry the light. The images show the original functional concept and renders.'],images:[['p5-0','触摸播放控制概念','Touch playback concept'],['p5-1','灯光与置物空间','Light and storage space']]}
    ];},
    views(){return [['p6-0','灯光氛围','Lighting atmosphere']];}
  },
  methods:{
    t(v){return v[this.zh?0:1];},src(n){return root+n+'.webp';},
    go(i){this.$el.querySelector('#music-part-'+i)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},
    open(item,event){this.enlarged=item;this.opener=event.currentTarget;this.$nextTick(()=>this.$refs.viewer.showModal());},
    close(){this.$refs.viewer.close();this.enlarged=null;this.opener?.focus();}
  },
  template:`<section class="shaker-story music-table-story" aria-label="Music side table design story">
    <nav class="shaker-chapters" :aria-label="zh?'项目章节':'Project chapters'"><button v-for="(label,i) in chapters" :key="label" @click="go(i)"><small>0{{i+1}}</small>{{label}}</button></nav>
    <section v-for="(part,i) in parts" :key="i" :id="'music-part-'+i" class="shaker-part">
      <header><small>PART 0{{i+1}} / MUSIC SIDE TABLE</small><h2>{{t(part.title)}}</h2><p>{{t(part.text)}}</p></header>
      <dl v-if="i===2" class="music-dimensions"><div v-for="row in (zh?[['宽度','60 cm'],['深度','66 cm'],['高度','41 cm']]:[['Width','60 cm'],['Depth','66 cm'],['Height','41 cm']])" :key="row[0]"><dt>{{row[0]}}</dt><dd>{{row[1]}}</dd></div></dl>
      <div class="shaker-figures" :class="{'shaker-figures--single':part.images.length===1}"><figure v-for="item in part.images" :key="item[0]"><button @click="open(item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item[zh?1:2]"><img :src="src(item[0])" :alt="item[zh?1:2]" loading="lazy"></button><figcaption>{{item[zh?1:2]}}<span>↗</span></figcaption></figure></div>
      <div v-if="i===3" class="music-features"><span>{{zh?'触摸控制':'Touch control'}}</span><span>{{zh?'音乐播放':'Music playback'}}</span><span>{{zh?'氛围灯光':'Ambient light'}}</span><span>{{zh?'日常置物':'Everyday storage'}}</span></div>
    </section>
    <section id="music-part-4" class="shaker-part"><header><small>PART 05 / PRODUCT GALLERY</small><h2>{{zh?'让音乐，融入家具。':'Music, shaped as furniture.'}}</h2><p>{{zh?'以灯光氛围呈现产品的整体效果。保留原始造型、透视与灯光，点击图片可放大。':'A lighting study presents the complete product. Original form, perspective and lighting are preserved. Click to enlarge.'}}</p></header>
      <figure class="music-gallery"><button @click="open(views[angle],$event)" :aria-label="zh?'放大当前视角':'Enlarge current view'"><img :src="src(views[angle][0])" :alt="views[angle][zh?1:2]"></button><figcaption>{{views[angle][zh?1:2]}} ↗</figcaption></figure>
    </section>
    <dialog ref="viewer" class="shaker-viewer" @cancel.prevent="close" @click="($event.target===$refs.viewer)&&close()"><button class="shaker-viewer-close" @click="close">{{zh?'关闭':'Close'}} ×</button><template v-if="enlarged"><img :src="src(enlarged[0])" :alt="enlarged[zh?1:2]"><p>{{enlarged[zh?1:2]}}</p></template></dialog>
  </section>`
};
