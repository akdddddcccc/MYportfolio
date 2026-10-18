export default {
  name:'ShakerStructure', props:['lang'],
  computed: {
    labels() { return [
      ['HC-05 蓝牙模块','HC-05 Bluetooth',24,18,39,39],
      ['KY-031 敲击传感器','KY-031 knock sensor',19,28,37,45],
      ['霍尔传感器','Hall sensor',14,39,32,49],
      ['倾斜传感器','Tilt sensor',46,12,52,41],
      ['LOGO','Logo',62,7,64,30],
      ['触摸开关','Touch switch',84,13,81,32],
      ['按压设计','Press detail',81,66,67,49],
      ['Nano 板','Nano board',65,76,56,53],
      ['电池','Battery',50,85,46,59],
      ['LED','LED',36,76,37,60],
      ['电池口','Battery access',20,87,23,65]
    ]; }
  },
  template:`<figure class="shaker-structure">
    <div class="shaker-structure-stage" :aria-label="lang==='zh'?'结构爆炸图，编号对应下方部件名称':'Exploded view with numbered component labels'">
      <div class="shaker-structure-product"><img src="/images/study/shaker/story/sensors-bare.webp" :alt="lang==='zh'?'SHAKER 无文字原始结构渲染':'SHAKER original unlabelled exploded render'"></div>
      <svg class="shaker-structure-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g v-for="(label,i) in labels" :key="i"><line :x1="label[2]" :y1="label[3]+3" :x2="label[4]" :y2="label[5]"/><circle :cx="label[4]" :cy="label[5]" r=".35"/></g></svg>
      <span v-for="(label,i) in labels" :key="i" class="shaker-structure-label" :style="{left:label[2]+'%',top:label[3]+'%'}"><b>{{String(i+1).padStart(2,'0')}}</b><span>{{label[lang==='zh'?0:1]}}</span></span>
    </div>
    <ol class="shaker-structure-key"><li v-for="(label,i) in labels" :key="i"><b>{{String(i+1).padStart(2,'0')}}</b>{{label[lang==='zh'?0:1]}}</li></ol>
    <figcaption>{{lang==='zh'?'结构爆炸图 · 标注按原设计整理，文字可选中复制':'Exploded view · selectable labels adapted from the original design'}}</figcaption>
  </figure>`
};
