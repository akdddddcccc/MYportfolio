import '../styles/guandan-story.css';
const root = '/images/work/guandan-story/';
const demo = '/images/work/guandan-demo/';
export default {
  name: 'GuandanStory', props: ['lang'],
  data() { return { enlarged: null, opener: null, prototypeIndex: 0 }; },
  computed: {
    zh() { return this.lang === 'zh'; },
    prototypePhoto() { return this.photos[this.prototypeIndex]; },
    prototypeDescription() { return (this.zh ? ['将设计打印出来，观察纹样、数字和纸张上的实际效果。','通过纸样反复调整尺寸与比例。','手工裁切，让平面图稿变成可以拿在手里的纸牌和包装。','借助 3D 打印原型，检查包装的结构与收纳关系。','将牌放在手中，检验多张纸牌的抓握与展开体验。','组装礼盒、牌盒与积分板，观察整套产品的组合效果。','回到真实牌局，观察玩家如何使用这套产品。'] : ['Print the artwork to inspect the patterns and numbers on paper.','Adjust dimensions and proportions with paper prototypes.','Cut the printed artwork into tangible cards and packaging.','Explore structure and storage with a 3D-printed prototype.','Test how a hand of cards feels and spreads.','Assemble the box, decks and board as a complete set.','Observe the set in an actual game.'])[this.prototypeIndex]; },
    suits() {
      const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
      const variants = ['New value','New value-1','New value-2','New value-3','New value-4','New value-5','New value-6','New value-7','New value-8','New value-11','New value-9','New value-10','模板13'];
      return [['白方块','方块','Diamonds'],['白红桃','红桃','Hearts'],['白黑桃','黑桃','Spades'],['白梅花','梅花','Clubs']].map(([folder,zh,en])=>({name:this.zh?zh:en,cards:ranks.map((rank,i)=>({rank,src:folder==='白红桃'?root+'white-hearts/heart-'+rank+'.svg':'/images/work/guandan-assets/'+folder+'/Property 1=正面, Property 2='+variants[i]+'.svg'}))}));
    },
    chapters() { return this.zh ? ['设计研究','视觉系统','字体与王牌','积分与套装','原型验证'] : ['Research','Visual system','Type & jokers','Scoring & packaging','Prototyping']; },
    photos() { return [['imgImage200','打印牌面','Printed faces'],['imgRectangle85','调整比例','Adjusting proportions'],['imgDsc29841','手工裁切','Cutting prototypes'],['imgDsc30071','3D 打印验证包装','3D-printed packaging'],['imgDsc29971','抓握与比例测试','Handling and proportions'],['imgDsc30022','原型效果验证','Assembled prototype'],['imgRectangle88','游戏测试','Play testing']].map(([name,zh,en])=>({src:root+'2095-16271-'+name+'.webp',caption:this.zh?zh:en})); },
    journey() { return this.zh ? [['组局','寻找同伴，等待四人到齐。','设计围绕真实的聚会和社交场景展开。'],['等人齐','两副牌混在一起后，不便拆分。','用颜色区分双副牌，兼容其他纸牌游戏。'],['对局','新手难记当前级牌与冲 A 次数。','用积分板和棋子把进度放到桌面上。'],['复盘','结算积分，再开始下一局。','把纸牌、记分与收纳纳入同一套产品。']] : [['Gather','Find partners and wait for four players.','Start with real social situations.'],['Wait','Mixed decks are difficult to separate.','Different colours help separate the two decks.'],['Play','Level cards and A attempts are hard to track.','Make progress visible with a board and tokens.'],['Review','Record the score and begin another round.','Connect play, scoring and storage.']]; }
  },
  methods: {
    hoverPrototype(event,index) { if(event.pointerType==='mouse') this.prototypeIndex=index; },
    prototypePosition(index) { const positions=[[22,12],[70,24],[22,37],[70,49],[22,62],[70,75],[32,89]]; return {left:positions[index][0]+'%',top:positions[index][1]+'%'}; },
    navigatePrototype(event,index) { const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key]; if(!direction)return; event.preventDefault(); this.prototypeIndex=(index+direction+this.photos.length)%this.photos.length; this.$nextTick(()=>this.$el.querySelectorAll('.gd-prototype-node')[this.prototypeIndex].focus()); },
    asset(name) { return root+'2095-15788-'+name; }, card(name) { return demo+name; },
    go(index) { this.$el.querySelector('#gd-part-'+index)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); },
    open(src,caption,event) { this.enlarged={src,caption}; this.opener=event.currentTarget; this.$nextTick(()=>this.$refs.viewer.showModal()); },
    close() { this.$refs.viewer.close(); this.enlarged=null; this.opener?.focus(); }
  },
  template: `
    <section class="gd-story" aria-label="Guandan design story">
      <nav class="gd-nav" :aria-label="zh ? '项目章节' : 'Project chapters'"><button v-for="(chapter,i) in chapters" :key="chapter" @click="go(i)"><span>0{{i+1}}</span>{{chapter}}</button></nav>
      <section class="gd-part" id="gd-part-0">
        <header class="gd-heading"><small>PART 01 / RESEARCH</small><h2>{{zh?'不止一副牌，是一场社交的载体。':'More than cards. A shared social experience.'}}</h2><p>{{zh?'从组局、等待、对局到复盘，原稿通过用户画像、行为旅程和竞品分析，寻找掼蛋专用产品的设计机会。关注点不只是牌面好不好看，也包括双副牌如何分开、复杂规则如何被看见。':'The original research follows players from gathering to reviewing a round. It explores how two decks can be separated, and how complex progress can become visible.'}}</p></header>
        <div class="gd-journey"><div v-for="(step,i) in journey" :key="step[0]"><small>0{{i+1}}</small><h3>{{step[0]}}</h3><p>{{step[1]}}</p><p class="gd-opportunity">{{step[2]}}</p></div></div>
        <p class="gd-note">{{zh?'研究整理 · 根据原项目设计稿重新编排，研究结论保留为该项目的设计依据。':'Research summary adapted from the original project.'}}</p>
      </section>
      <section class="gd-part" id="gd-part-1">
        <header class="gd-heading"><small>PART 02 / VISUAL SYSTEM</small><h2>{{zh?'用几何，重构熟悉的花色。':'Familiar suits. A new geometry.'}}</h2><p>{{zh?'以旋转、对称、缩放构成牌面秩序，借用包豪斯的几何语言重新组织花色。通过组件化的数字、花色与纹样，形成可以组合和延展的牌面系统。':'Rotation, symmetry and scale create the face patterns. Modular numbers, suits and compositions form a coherent, extensible system.'}}</p></header>
        <div class="gd-suits"><section v-for="suit in suits" :key="suit.name" class="gd-suit"><h3>{{suit.name}} <small>A — K</small></h3><div class="gd-suit-cards"><button v-for="face in suit.cards" :key="face.rank" @click="open(face.src,suit.name+' '+face.rank,$event)" :aria-label="suit.name+' '+face.rank"><img :src="face.src" :alt="suit.name+' '+face.rank" loading="lazy" width="500" height="1000"></button></div></section></div>
        <div class="gd-split"><div><h3>{{zh?'两副牌，清晰区分。':'Two distinct decks.'}}</h3><p>{{zh?'两副牌使用不同底色，混合进行掼蛋对局后，也能快速整理回单副牌。牌面采用 1:2 的长宽比，回应多张手牌的抓握需求。':'Contrasting deck colours make separation easier after a game. A 1:2 proportion addresses the handling of larger hands.'}}</p><p>{{zh?'牌背与包装的圆形链条，取意于河图洛书。':'The circular chains on the back and packaging draw inspiration from Hetu and Luoshu.'}}</p></div><div class="gd-card-row"><img v-for="name in ['white-club-10.svg','black-heart-7.svg','card-back.svg']" :key="name" :src="card(name)" :alt="name" loading="lazy"></div></div>
      </section>
      <section class="gd-part" id="gd-part-2">
        <header class="gd-heading"><small>PART 03 / TYPOGRAPHY & JOKERS</small><h2>{{zh?'表达个性，也保持可读。':'Character without losing clarity.'}}</h2><p>{{zh?'字体设计经过手稿与抽象化的尝试，最终让小尺寸牌面使用 JetBrains Mono，把自设计字体用于面积更大的积分板。王牌则把“大毛、小毛”的称呼转化成带有汉字意味的视觉符号。':'After sketching and abstraction, JetBrains Mono was chosen for small card labels, while the custom type appears on the larger scoring board. The jokers reinterpret their local nicknames through Chinese character-inspired forms.'}}</p></header>
        <div class="gd-type-grid"><figure><div class="gd-type-samples"><img v-for="name in ['imgGroup47.svg','imgGroup48.svg','imgGroup49.svg']" :src="asset(name)" :key="name" alt="自设计字体抽象化" loading="lazy"></div><figcaption>{{zh?'字体探索 / J · Q · K':'Type exploration / J · Q · K'}}</figcaption></figure><figure><div class="gd-jokers"><img :src="asset('imgGroup105.svg')" alt="小王图案" loading="lazy"><img :src="asset('imgGroup106.svg')" alt="大王图案" loading="lazy"></div><figcaption>{{zh?'汉字元素 / 小王 · 大王':'Character-inspired jokers'}}</figcaption></figure></div>
      </section>
      <section class="gd-part" id="gd-part-3">
        <header class="gd-heading"><small>PART 04 / A COMPLETE SET</small><h2>{{zh?'把规则和进度，放到桌面上。':'Bring progress onto the table.'}}</h2><p>{{zh?'黑白棋子记录双方进度；三个 A 格区分冲 A 的不同阶段。积分板、两副牌和礼盒延续同一套几何语言，让使用与收纳成为完整的体验。':'Black and white tokens track both teams. Three A spaces distinguish successive attempts. The board, two decks and gift box share one geometric language.'}}</p></header>
        <div class="gd-system"><figure><button @click="open(card('scoreboard.svg'),zh?'积分板高清平面':'Scoring board',$event)"><img :src="card('scoreboard.svg')" alt="积分板高清平面" loading="lazy"></button><figcaption>{{zh?'积分板 / 点击查看高清 SVG':'Scoring board / View SVG'}}</figcaption></figure><figure><button @click="open(card('packaging-interaction.png'),zh?'套装设计':'Packaging design',$event)"><img :src="card('packaging-interaction.png')" alt="完整套装" loading="lazy"></button><figcaption>{{zh?'套装设计 / 下方可点击部件查看细节':'Complete set / Explore components below'}}</figcaption></figure></div>
      </section>
      <section class="gd-part" id="gd-part-4">
        <header class="gd-heading"><small>PART 05 / PROTOTYPING</small><h2>{{zh?'从平面，走向真实的一局。':'From the page to the table.'}}</h2><p>{{zh?'通过打印、裁切、调整比例与抓握测试验证纸牌，再用 3D 打印和实物原型检查包装。最终回到实际游戏场景，观察设计如何被使用。':'Printing, cutting and handling tests informed the card proportions. Physical and 3D-printed prototypes explored packaging before returning to actual play.'}}</p></header>
        <div class="gd-prototype">
          <div class="gd-prototype-map" :aria-label="zh?'原型制作流程':'Prototype process'">
            <svg class="gd-prototype-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M22 12 C22 -2 70 4 70 24 S22 19 22 37 S70 31 70 49 S22 44 22 62 S70 57 70 75 S32 100 32 89" /></svg>
            <button v-for="(photo,i) in photos" :key="photo.src" type="button" class="gd-prototype-node" :class="{active:prototypeIndex===i}" :style="prototypePosition(i)" :aria-label="(i+1)+'. '+photo.caption" :aria-pressed="prototypeIndex===i" aria-controls="gd-prototype-preview" @pointerenter="hoverPrototype($event,i)" @focus="prototypeIndex=i" @click="prototypeIndex=i" @keydown="navigatePrototype($event,i)"><span class="gd-prototype-circle"><img :src="photo.src" alt="" loading="lazy"><span class="gd-prototype-number">0{{i+1}}</span></span><span class="gd-prototype-label">{{photo.caption}}</span></button>
          </div>
          <div id="gd-prototype-preview" class="gd-prototype-preview">
            <div class="gd-prototype-meta"><span>0{{prototypeIndex+1}} / 07</span><span>{{zh?'悬停 / 点击节点':'Hover / select a node'}}</span></div>
            <button class="gd-prototype-photo" @click="open(prototypePhoto.src,prototypePhoto.caption,$event)" :aria-label="(zh?'放大查看：':'Enlarge: ')+prototypePhoto.caption"><img :key="prototypePhoto.src" :src="prototypePhoto.src" :alt="prototypePhoto.caption"></button>
            <div class="gd-prototype-copy"><h3>{{prototypePhoto.caption}}</h3><p>{{prototypeDescription}}</p></div>
            <span class="gd-prototype-hint">{{zh?'点击照片，查看完整大图 ↗':'Click the photo to enlarge ↗'}}</span>
          </div>
        </div>
      </section>
      <div class="gd-experience-lead"><small>TRY THE DESIGN</small><h2>{{zh?'现在，亲手试一试。':'Now, try it yourself.'}}</h2><p>{{zh?'下方保留牌桌演示和套装探索：点选手牌、拨动牌堆、自由拖动棋子，再查看各个包装部件。':'Explore the table, move the tokens, and inspect the packaging below.'}}</p></div>
      <dialog ref="viewer" class="gd-viewer" @click="$event.target===$refs.viewer && close()" @cancel.prevent="close()"><template v-if="enlarged"><button class="gd-close" @click="close()">{{zh?'关闭':'Close'}} ×</button><img :src="enlarged.src" :alt="enlarged.caption"><p>{{enlarged.caption}}</p></template></dialog>
    </section>`
};
