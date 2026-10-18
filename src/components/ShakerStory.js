import '../styles/shaker-story.css';
import ShakerStructure from './ShakerStructure.js';
const root = '/images/study/shaker/story/';
export default {
  name: 'ShakerStory', props: ['lang'],
  components: { ShakerStructure },
  data() { return { enlarged: null, opener: null }; },
  computed: {
    zh() { return this.lang === 'zh'; },
    sections() { return [
      {title:['让陌生人的交流，有一个开始。','A starting point for conversation.'],text:['SHAKER 希望减少面对面交流中的心理距离，用可见的灯光表达谈话氛围，让一件手持产品成为社交的媒介。原项目从色彩与情绪的关系出发，探索“愉悦”和“兴奋”两个维度与光色之间的对应。','SHAKER explores how a handheld light can reduce social barriers and make the atmosphere of a conversation visible. The original research considers pleasure and excitement as dimensions for relating emotion to colour.'],images:[['emotion-wheel','色彩与情绪研究','Colour and emotion'],['emotion-map','情绪与色彩映射参考','Emotion–colour mapping']]},
      {title:['像调酒一样，展开社交。','Socialising, like mixing a cocktail.'],text:['以杯状、手持、碰杯、倾倒和色彩混合为线索，从使用故事推导产品形态。造型经过曲面、方体和筒状等方案探索，逐步形成最终的外壳设计。','The concept draws on holding a cup, toasting, pouring and mixing colours. Sketches explore curved, cubic and cylindrical forms before arriving at the final shell.'],images:[['storyboard','使用故事板','Use storyboard'],['form-development','造型推演与草图','Form development and sketches']]},
      {title:['把动作，转化为光的回应。','Turn gestures into light.'],text:['原稿以触摸开启、触摸换色、倾倒与摇晃等行为组织交互。下图保留原始交互流程，展示动作如何与灯光状态关联；它是产品设计说明，不是网页中的硬件模拟器。','The original interaction diagram connects touch, colour selection, pouring and shaking with light states. It documents the product behaviour rather than simulating the hardware in this webpage.'],images:[['interaction','原始产品交互流程','Original interaction flow']]},
      {title:['从外壳，进入内部系统。','Inside the product.'],text:['结构方案包含 Nano 板、LED、电池、HC-05 蓝牙模块，以及敲击、倾斜、霍尔传感器和触摸开关。通过原型电路与 Arduino 编程，把设计中的动作反馈落实到可测试的装置中。','The proposed system combines a Nano board, LEDs, a battery, HC-05 Bluetooth, and knock, tilt, Hall and touch inputs. Circuit prototyping and Arduino programming support testing the intended responses.'],images:[['sensors','结构爆炸图与传感器分布','Exploded view and sensors']]},
      {title:['从概念，做到可以点亮的原型。','From concept to a working light.'],text:['经过焊接、组装、整理电路、代码编写和调试，制作实物原型。下方并列展示原稿中的白光和彩光实拍，保留照片本身的比例；演示视频和原型代码继续保留在页面后方。','Soldering, assembly, wiring, programming and debugging lead to physical prototypes. Original white-light and coloured-light photographs are shown without stretching. The demonstration video and prototype code remain below.'],images:[['prototype-white','白光实物原型','White-light prototype'],['prototype-colour','彩光实物原型','Colour-light prototype']]}
    ]; }
  },
  methods: {
    text(value) { return value[this.zh ? 0 : 1]; },
    src(name) { return root + name + '.webp'; },
    go(i) { this.$el.querySelector('#shaker-part-'+i)?.scrollIntoView({behavior:'smooth',block:'start'}); },
    open(item,event) { this.enlarged=item; this.opener=event.currentTarget; this.$nextTick(()=>this.$refs.viewer.showModal()); },
    close() { this.$refs.viewer.close(); this.enlarged=null; this.opener?.focus(); }
  },
  template: `
    <section class="shaker-story" aria-label="SHAKER design story">
      <nav class="shaker-chapters" :aria-label="zh?'项目章节':'Project chapters'"><button v-for="(label,i) in (zh?['设计出发点','造型推演','交互方式','内部结构','实物原型']:['Intent','Form','Interaction','Structure','Prototype'])" :key="label" @click="go(i)"><small>0{{i+1}}</small>{{label}}</button></nav>
      <section v-for="(part,i) in sections" :key="i" :id="'shaker-part-'+i" class="shaker-part" :class="{'shaker-part--dark':i===4}">
        <header><small>PART 0{{i+1}} / SHAKER</small><h2>{{text(part.title)}}</h2><p>{{text(part.text)}}</p></header>
        <ShakerStructure v-if="i===3" :lang="lang" />
        <div v-else class="shaker-figures" :class="{'shaker-figures--single':part.images.length===1}"><figure v-for="item in part.images" :key="item[0]"><button @click="open(item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item[zh?1:2]"><img :src="src(item[0])" :alt="item[zh?1:2]" loading="lazy"></button><figcaption>{{item[zh?1:2]}} <span>↗</span></figcaption></figure></div>
      </section>
      <figure class="shaker-concept"><button @click="open(['concept','最终概念渲染','Final concept rendering'],$event)" :aria-label="zh?'放大概念渲染':'Enlarge concept rendering'"><img :src="src('concept')" :alt="zh?'SHAKER 最终概念渲染':'SHAKER final concept rendering'" loading="lazy"></button><figcaption>{{zh?'用交流，为气氛着色。':'Colour the atmosphere through conversation.'}}</figcaption></figure>
      <dialog ref="viewer" class="shaker-viewer" @cancel.prevent="close" @click="($event.target===$refs.viewer)&&close()"><button class="shaker-viewer-close" @click="close">{{zh?'关闭':'Close'}} ×</button><template v-if="enlarged"><img :src="src(enlarged[0])" :alt="enlarged[zh?1:2]"><p>{{enlarged[zh?1:2]}}</p></template></dialog>
    </section>`
};
