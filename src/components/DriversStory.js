import '../styles/shaker-story.css';
import '../styles/drivers-story.css';
const root='/images/study/drivers-story/';
const approvedRoot='/images/approved-renders-20261022/';
const improved={'p6-7':root+'system-hud-v2.webp','p5-0':approvedRoot+'hardware01.png','p5-1':approvedRoot+'hardware02.png','p6-0':approvedRoot+'hardware03.png','p6-1':approvedRoot+'hardware04.png','p6-2':approvedRoot+'hardware05.png','p6-5':approvedRoot+'hardware06.png','p6-6':approvedRoot+'hardware07.png'};
export default {
  name:'DriversStory', props:['lang'],
  data(){return{enlarged:null,opener:null,angle:0,original:false};},
  computed:{
    zh(){return this.lang==='zh';},
    chapters(){return this.zh?['设计目标','产品架构','造型推演','反馈探索','结构与材质','最终展示']:['Intent','Architecture','Form','Feedback','Structure & CMF','Gallery'];},
    parts(){return[
      {title:['驾驶之外，也能融入日常。','Designed for play. Considered for home.'],text:['本项目探索家庭场景下的驾驶游戏外设：既保留双手操作和驾驶反馈，也考虑设备闲置时的空间占用、收纳与家居协调。设计将传统方向盘的使用方式，拆解为固定交互台与可拆卸手柄。','This concept explores driving-game peripherals for the home, balancing two-handed control with storage and spatial integration. A fixed interaction console is paired with a detachable controller.'],images:[['p2-1','传统方向盘外设参考','Conventional wheel reference'],['p2-0','触觉体验研究参考','Reference for tactile experience']]},
      {title:['一套系统，两种使用方式。','One system. Two ways to play.'],text:['固定台承载 HUD、辅助控制和安装结构；手柄承担主要操作，拆卸后可用于其他游戏。原方案把加速与减速映射到左右主按键，并用外置操纵件探索档位切换。','The console carries a HUD, auxiliary controls and mounting structure. The detachable controller supports primary input and other games. The proposal maps acceleration and braking to the main buttons and explores a separate shifting control.'],images:[['p3-3','固定台与可拆卸手柄草图','Console and detachable controller'],['p6-0','手柄拆卸关系','Detachable controller concept']]},
      {title:['让握持、曲面与家居相遇。','Bringing grip, form and home together.'],text:['从握持舒适性和双手操作姿态出发，通过草图推导连续曲面与向内收拢的握持区域。固定台与手柄共享分层和曲面语言，使组合状态保持一致。','Sketches explore continuous surfaces and inward-facing grips around two-handed use. Layered surfaces connect the controller and console into a consistent product family.'],images:[['sketches','造型探索草图','Form exploration'],['p3-1','固定台造型草图','Console sketch']]},
      {title:['反馈，不只发生在屏幕里。','Feedback beyond the screen.'],text:['概念从表面起伏、振动、光效与温度等通道探索驾驶反馈。原稿包含 Grasshopper 伸缩矩阵模拟，以及加热、雾化、灯带与情绪识别相关技术构想。这里展示设计探索，不代表已完成联调或用户验证。','The concept explores surface displacement, vibration, light and temperature. The original material includes a Grasshopper displacement-array study and proposals involving heating, mist, LEDs and emotion recognition. These are design explorations, not claims of integrated or user-validated performance.'],images:[['p4-2','伸缩矩阵形态模拟','Displacement-array simulation'],['p4-3','Grasshopper 参数化探索','Grasshopper exploration'],['p4-0','规则波纹参考','Regular-wave reference'],['p4-6','噪波纹理参考','Noise-pattern reference']]},
      {title:['把材质，落到每一次接触。','Materials at every touchpoint.'],text:['主体以白色塑料表达家居消费电子的轻量感；握持区域、透明材料与金属连接部位形成触感和视觉层次。结构图保留原稿，材质说明用网页文字呈现。','White plastic gives the concept a domestic consumer-electronics character. Grip surfaces, transparent materials and metal connections introduce tactile and visual layers. The original structural drawing is retained alongside readable web text.'],images:[['p5-2','结构分解原稿','Original exploded study'],['p5-1','正面材质与显示区域','Front materials and display'],['p5-0','连接轴与后侧结构','Shaft and rear structure']]}
    ];},
    views(){return [['p6-7','完整系统','Complete system'],['p6-6','驾驶场景','Driving scene'],['p6-5','操作角度','Interaction angle'],['p6-2','后侧结构','Rear structure'],['p6-1','局部细节','Close-up']];}
  },
  methods:{
    t(v){return v[this.zh?0:1];}, src(n){return !this.original&&improved[n]?improved[n]:root+n+'.webp';},
    go(i){this.$el.querySelector('#drivers-part-'+i)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},
    open(item,event){this.enlarged=item;this.opener=event.currentTarget;this.$nextTick(()=>this.$refs.viewer.showModal());},
    close(){this.$refs.viewer.close();this.enlarged=null;this.opener?.focus();}
  },
  template:`<section class="shaker-story drivers-story" aria-label="Driving controller design story">
    <nav class="shaker-chapters" :aria-label="zh?'项目章节':'Project chapters'"><button v-for="(label,i) in chapters" :key="label" @click="go(i)"><small>0{{i+1}}</small>{{label}}</button></nav>
    <section v-for="(part,i) in parts" :key="i" :id="'drivers-part-'+i" class="shaker-part">
      <header><small>PART 0{{i+1}} / DRIVING CONTROLLER</small><h2>{{t(part.title)}}</h2><p>{{t(part.text)}}</p></header>
      <p v-if="i===3" class="drivers-status">{{zh?'概念 / 原型探索 · 非量产功能说明':'Concept / prototype exploration · not a production specification'}}</p>
      <div class="shaker-figures"><figure v-for="item in part.images" :key="item[0]"><button @click="open(item,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+item[zh?1:2]"><img :src="src(item[0])" :alt="item[zh?1:2]" loading="lazy"></button><figcaption>{{item[zh?1:2]}}<span>↗</span></figcaption></figure></div>
      <dl v-if="i===4" class="drivers-materials"><div v-for="row in (zh?[['主体','高光白色塑料'],['握持与局部透光','磨砂亚克力与透明材料'],['连接部位','金属包边与茶色透明轴体']]:[['Body','Gloss white plastic'],['Grip and optical areas','Frosted acrylic and transparent materials'],['Connection','Metal trim and tinted transparent shaft']])" :key="row[0]"><dt>{{row[0]}}</dt><dd>{{row[1]}}</dd></div></dl>
    </section>
    <section id="drivers-part-5" class="shaker-part"><header><small>PART 06 / PRODUCT GALLERY</small><h2>{{zh?'回到真实的使用空间。':'Back in the living space.'}}</h2><p>{{zh?'切换视角，查看固定台、手柄与 HUD 的组合关系。展示图已完成材质与光照优化，可切换原始渲染对照；仅正视图采用概念驾驶 HUD，其余视角保留原屏幕方案。':'Explore the console, controller and HUD with refined materials and lighting, or compare the original renders. Only the front view uses a conceptual driving HUD; other angles retain the original screen concept.'}}</p></header><div class="drivers-view-controls"><button v-for="(item,i) in views" :key="item[0]" :aria-pressed="angle===i" @click="angle=i">{{item[zh?1:2]}}</button></div><div class="drivers-view-controls" :aria-label="zh?'图像版本':'Image version'"><button :aria-pressed="!original" @click="original=false">{{zh?'优化展示':'Refined'}}</button><button :aria-pressed="original" @click="original=true">{{zh?'原始渲染':'Original'}}</button></div><figure class="drivers-gallery"><button @click="open(views[angle],$event)" :aria-label="zh?'放大当前视角':'Enlarge current view'"><img :src="src(views[angle][0])" :alt="views[angle][zh?1:2]"></button><figcaption>{{views[angle][zh?1:2]}} ↗</figcaption></figure></section>
    <dialog ref="viewer" class="shaker-viewer" @cancel.prevent="close" @click="($event.target===$refs.viewer)&&close()"><button class="shaker-viewer-close" @click="close">{{zh?'关闭':'Close'}} ×</button><template v-if="enlarged"><img :src="src(enlarged[0])" :alt="enlarged[zh?1:2]"><p>{{enlarged[zh?1:2]}}</p></template></dialog>
  </section>`
};
