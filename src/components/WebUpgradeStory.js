import '../styles/shaker-story.css';
import '../styles/web-upgrade-story.css';

const original = '/images/work/页面优化/1.png';
const sourceUrl = 'https://www.figma.com/design/72nWkl42XoSs7HZVlOHJyM/工作用?node-id=369-900';

export default {
  name: 'WebUpgradeStory', props: ['lang'],
  data() {
    return { selected: 0, original, sourceUrl, opener: null };
  },
  computed: {
    zh() { return this.lang === 'zh'; },
    areas() {
      return this.zh ? [
        { title:'功能导航', note:'预览、AI 预览、回放、设置、报警与注销集中在顶部，保留原有功能路径。', region:[59.1,17.1,40.9,5], label:'预览 / AI 预览 / 回放 / 设置 / 报警 / 注销', crop:[1130,185,782,56] },
        { title:'视频与工具', note:'视频占据主要空间；码流、传输协议与画面工具围绕视频组织。查看内容与操作入口保持直接关联。', region:[4.1,24.1,73.1,75.9], label:'主码流 / 辅码流 / 流媒体协议 / 视频工具', crop:[79,260,1397,67] },
        { title:'设备控制', note:'右侧集中云台方向、变倍、变焦、光圈和预置点控制。说明使用真实文字，细节保留原始界面。', region:[78.1,24.1,21.9,54.9], label:'云台控制 / 变倍 / 变焦 / 光圈 / 预置点', crop:[1492,261,420,593] }
      ] : [
        { title:'Navigation', note:'Preview, AI preview, playback, settings, alarms and sign-out remain grouped at the top, retaining the existing functional paths.', region:[59.1,17.1,40.9,5], label:'Preview / AI preview / Playback / Settings / Alarms / Sign out', crop:[1130,185,782,56] },
        { title:'Video & tools', note:'Video occupies the main workspace. Stream selection, transport settings and viewing tools are organised around it.', region:[4.1,24.1,73.1,75.9], label:'Main stream / Substreams / Transport protocol / Video tools', crop:[79,260,1397,67] },
        { title:'Device control', note:'Pan and tilt, zoom, focus, aperture and presets are grouped on the right. Native text explains the preserved interface details.', region:[78.1,24.1,21.9,54.9], label:'PTZ / Zoom / Focus / Aperture / Presets', crop:[1492,261,420,593] }
      ];
    },
    area() { return this.areas[this.selected]; },
    highlight() {
      const r=this.area.region;
      return {left:r[0]+'%',top:r[1]+'%',width:r[2]+'%',height:r[3]+'%'};
    },
    cropStyle() {
      const [x,y,w,h]=this.area.crop;
      return {width:(1912/w*100)+'%',left:(-x/w*100)+'%',top:(-y/h*100)+'%',height:(1081/h*100)+'%'};
    },
    constraints() {
      return this.zh ? [
        ['布局不重排','在既有页面布局内调整视觉呈现，不重新定义操作路径。'],
        ['逻辑不改动','保持系统内部逻辑，围绕已有功能做界面升级。'],
        ['内核不更换','以前端内核不变为前提，关注界面清晰度与视觉一致性。']
      ] : [
        ['Keep the layout','Improve the existing layout without redefining the operation paths.'],
        ['Keep the logic','Retain internal system logic and work with the existing functionality.'],
        ['Keep the engine','Work within the existing front-end engine, focusing on clarity and visual consistency.']
      ];
    }
  },
  methods: {
    open(event) { this.opener=event.currentTarget;this.$refs.viewer.showModal(); },
    close() { this.$refs.viewer.close(); },
    closed() { this.opener?.focus({preventScroll:true}); }
  },
  template: `<article class="shaker-story web-upgrade-story" :aria-label="zh?'硬件界面优化案例':'Hardware interface design case study'">
    <section class="shaker-part">
      <header><small>PART 01 / DESIGN WITHIN CONSTRAINTS</small><h2>{{zh?'不推翻系统，':'Improve the interface,'}}<br>{{zh?'先改善看与用。':'without replacing the system.'}}</h2><p>{{zh?'公司硬件产品界面的一次阶段性视觉优化。项目的重点不是增加功能，而是在页面布局、内部逻辑和前端内核不变的条件下，提高界面的清晰度与整体一致性。':'An incremental visual update for a hardware-product interface. The focus is clarity and consistency within the existing page layout, internal logic and front-end engine, rather than additional features.'}}</p></header>
      <div class="web-constraints"><section v-for="(item,i) in constraints" :key="i"><small>0{{i+1}}</small><h3>{{item[0]}}</h3><p>{{item[1]}}</p></section></div>
    </section>
    <section class="shaker-part">
      <header><small>PART 02 / A REAL INTERFACE, READABLE IN PARTS</small><h2>{{zh?'以画面为主，':'Video first,'}}<br>{{zh?'让控制各就其位。':'with controls in context.'}}</h2><p>{{zh?'这张已归档的真实界面包含导航、视频与设备控制三个区域。点击下方分类，查看对应区域的原始细节；这是作品解读，不是对真实设备的远程控制。':'The archived interface contains navigation, video and device-control areas. Select a category to inspect its original details. This is a case-study viewer, not a live connection to the device.'}}</p></header>
      <div class="web-area-tabs" role="group" :aria-label="zh?'查看界面区域':'Inspect interface areas'"><button v-for="(item,i) in areas" :key="i" type="button" :aria-pressed="selected===i" @click="selected=i"><small>0{{i+1}}</small>{{item.title}}</button></div>
      <figure class="web-overview"><button type="button" @click="open" :aria-label="zh?'放大查看完整原始界面':'Enlarge the complete archived interface'"><img :src="original" :alt="zh?'中鼎设备网页端预览与云台控制界面':'Zhongding web preview and PTZ interface'" width="1912" height="1081"><span class="web-highlight" :style="highlight" aria-hidden="true"></span></button><figcaption>{{zh?'归档的真实界面 · 保持完整比例':'Archived interface · original proportions'}}<span>↗</span></figcaption></figure>
      <div class="web-inspection"><div class="web-crop-stage"><div class="web-crop" :style="{aspectRatio:area.crop[2]+'/'+area.crop[3]}"><img :src="original" alt="" :style="cropStyle" aria-hidden="true"></div></div><div class="web-area-copy" aria-live="polite"><small>AREA 0{{selected+1}}</small><h3>{{area.title}}</h3><p>{{area.note}}</p><div class="web-native-labels">{{area.label}}</div></div></div>
    </section>
    <footer class="web-story-footer"><p>{{zh?'原始界面保留为设计资料，局部展示均来自同一张归档原图。':'The original interface is retained as design evidence. All detail views come from the same archived image.'}}</p><a :href="sourceUrl" target="_blank" rel="noopener">{{zh?'打开 Figma 原稿':'Open the Figma source'}} ↗</a></footer>
    <dialog ref="viewer" class="web-viewer" :aria-label="zh?'完整界面查看':'Full interface viewer'" @click.self="close" @close="closed"><button class="web-viewer-close" type="button" @click="close" :aria-label="zh?'关闭图片':'Close image'">×</button><img :src="original" :alt="zh?'原始界面全图':'Complete archived interface'"><a :href="original" target="_blank" rel="noopener">{{zh?'独立打开原始图片':'Open the original image'}} ↗</a></dialog>
  </article>`
};
