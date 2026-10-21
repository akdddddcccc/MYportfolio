// Original image fills from Figma test_function / 时感 (1110:2).
// Reflowed as individual images, not screenshots of the presentation boards.
import dimensions from './timeImageDimensions.js';
const photo = (file, zh, en) => ({ src: '/images/study/time-story/figma/' + file + '.webp', width: dimensions[file][0], height: dimensions[file][1], background: file.startsWith('284-') ? '#f8f6f6' : '#090b0e', zh, en });
export const mediaPhotos = [
  [photo('65-img7', '圆形与循环', 'Circular forms and cycles'), photo('65-imgImage24', '噪波与呼吸感', 'Noise and breathing forms'), photo('65-img16', '线条的形态变化', 'Changing line forms'), photo('65-imgImage44', '波形与节奏', 'Waveforms and rhythm')],
  [photo('65-img10', '暗环境中的光', 'Light in darkness'), photo('65-imgImage25', '可见的光束', 'Visible beams of light'), photo('65-imgImage26', '光与空间的边界', 'Light defining space')],
  [photo('65-img5', '雾光与柔化的边界', 'Haze and softened boundaries'), photo('65-imgRectangle1', '环形光的参考', 'Circular light reference')],
  [photo('65-img9', '云层的起伏', 'Movement of clouds'), photo('65-img17', '波涛的循环', 'The rhythm of waves')]
];
export const sketches = [photo('284-imgDcim181', '流畅交互空间 · 草图', 'Responsive space · sketch'), photo('284-imgDcim192', '迟滞交互空间 · 草图', 'Delayed space · sketch'), photo('284-imgDcim171', '空间形态推敲', 'Exploring spatial forms')];
// Dark drawing strokes require the original light paper background.
sketches.forEach(item => { item.backgroundLocked = true; });
// Crop only the transparent outer margin in the presentation, leaving the asset intact.
// Alpha bounds within the 2200 x 1537 source: x=35..1361, y=0..1489.
sketches[2].featured = true;
sketches[2].crop = { '--crop-ratio': '1326 / 1489', '--crop-width': '165.91252%', '--crop-height': '103.22364%', '--crop-left': '-2.63952%', '--crop-top': '0%' };
export const models = [photo('284-imgTime', '空间模型', 'Spatial model'), photo('284-imgImage52', '空间尺度研究', 'Spatial scale study'), photo('284-imgDsc2648', '3D 打印模型', '3D-printed model'), photo('284-imgDsc27041', '模型细节', 'Model detail')];
export const technology = [photo('284-imgImage10', 'TouchDesigner · 节点网络', 'TouchDesigner · node network'), photo('284-imgImage38', 'Arduino · LED 控制代码', 'Arduino · LED control code'), photo('284-imgImage6', 'Leap Motion · 手部追踪', 'Leap Motion · hand tracking')];
export const making = [photo('125-imgE0A2C321Ecd14752B14FF6677Dffcb42', '空间中的云层搭建', 'Building clouds in the space'), photo('125-img', '云层与灯光测试', 'Testing clouds and light'), photo('125-img2Acb5Af1F55D4F5195846921A0A8D469', '雾气效果实验', 'Experimenting with haze'), photo('125-imgC456111171714F9A9509796A145774232', '悬挂与空间布置', 'Hanging and arranging the installation'), photo('125-imgDsc2573', '雾光的现场测试', 'Testing light through haze'), photo('125-imgDsc2665', '实体模型制作记录', 'Physical model making'), photo('125-imgImg202208151852322', '展示拍摄记录', 'Documenting the installation')];
export const details = [photo('125-imgDsc2530', '人与雾光', 'Body, haze and light'), photo('125-imgImg2917Mp400001223', '身体进入投影空间', 'Entering the projected space'), photo('125-imgVid20220815192544Moment', '云层中的光', 'Light within the clouds'), photo('125-imgDsc24961', '环形视觉反馈', 'Circular visual feedback'), photo('125-imgDsc2485Mov2226', '手势与投影', 'Gesture and projection'), photo('125-imgDsc2523', '光束穿过介质', 'Light passing through a medium')];
export const exhibition = photo('268-imgRectangle1', '时感 · 最终现场展示', 'Sense of Time · final exhibition');
