import {capture, clamp, pyramid, renderer} from './engine.js';

// Only the photo currently being used is requested. Imported photos never leave the browser.
const samples = [
  {file: 'materials.jpg', x: .58, y: .48},
  {file: 'angles.jpg', x: .448, y: .445},
];
const copy = {
  zh: {
    viewer:'图片预览', settings:'对焦设置', loading:'读取图片…', original:'查看原图', effect:'返回效果', focus:'焦点',
    width:['清晰范围','调小，让清晰的细节更集中。'], blur:['边缘虚焦','控制远离焦点处的柔化程度。'], fade:['边缘去色','从清晰区外侧开始褪色，保留焦点的原色。'],
    choose:'打开照片', save:'导出 PNG', saving:'导出中…', preparing:'准备原尺寸图片…', progress:'正在导出', done:'已生成',
    hint:'点击照片设焦，方向键微调，按住 Shift 加大步幅。也可以把自己的照片拖到画面上。', samples:'现场示例',
    names:['书画街 · 装裱材料','书画街 · 装裱角样'], privacy:'在本机处理 · 原尺寸导出',
    badFile:'这张图片无法读取。可以换成 JPG、PNG 或 WebP 再试。', failed:'导出失败。请用尺寸小一点的照片再试。', suffix:'-聚焦',
  },
  en: {
    viewer:'Photo preview', settings:'Focus settings', loading:'Loading photo…', original:'View original', effect:'Back to effect', focus:'Focus',
    width:['Focus area','Reduce the area to isolate fine details.'], blur:['Edge blur','Soften details away from the focus.'], fade:['Edge desaturation','Fade colour gradually outside the sharp area.'],
    choose:'Open photo', save:'Export PNG', saving:'Exporting…', preparing:'Preparing the full-size photo…', progress:'Exporting', done:'Created',
    hint:'Click the photo to focus. Use the arrow keys to fine-tune; hold Shift for a larger step. You can also drop your own photo here.', samples:'Samples',
    names:['Shuhua Street · Framing materials','Shuhua Street · Frame corners'], privacy:'Processed on your device · Full-resolution export',
    badFile:'This image could not be opened. Try a JPG, PNG or WebP file.', failed:'Export failed. Try a smaller copy of the photo.', suffix:'-focus',
  },
};
// Match the photographed corner sample and graded transition on the portfolio card.
const fields = {width:26, blur:77, fade:84};
const liveMounts = new WeakMap();

export function mountFocusFilter(host, {lang='zh', asset=file=>new URL(file,import.meta.url).href}={}) {
  liveMounts.get(host)?.();
  const root = host.shadowRoot || host.attachShadow({mode:'open'});
  const en = lang === 'en', t = en ? copy.en : copy.zh, css=asset('workbench.css');
  // Markup contains only our own constants. Photo filenames are set with textContent.
  root.innerHTML = `<link rel="stylesheet" href="${css}">
    <section class="workbench" lang="${en?'en':'zh-CN'}" aria-label="${t.settings}">
      <div class="workspace">
        <section class="viewer" aria-label="${t.viewer}">
          <div class="panelHead"><span class="source" id="source-label">${t.loading}</span><button class="subbtn" id="compare" aria-pressed="false" disabled>${t.original}</button></div>
          <div class="stage" id="stage"><canvas id="preview" tabindex="0" aria-label="${t.viewer}" aria-describedby="hint"></canvas><span class="focus-cursor" hidden aria-hidden="true"></span></div>
          <div class="stageMeta"><span id="size">—</span><span id="coords">—</span></div>
        </section>
        <aside class="controls">
          <div class="controlsHead"><h2>${t.settings}</h2><span class="kicker" aria-hidden="true">FOCUS</span></div>
          ${Object.entries(fields).map(([id,value])=>`<div class="field"><div class="row"><label for="${id}">${t[id][0]}</label><output for="${id}" id="v${id}">${value}%</output></div><input id="${id}" type="range" min="0" max="100" value="${value}" aria-describedby="help-${id}"><small id="help-${id}">${t[id][1]}</small></div>`).join('')}
          <p class="hint" id="hint">${t.hint}</p>
          <div class="actions"><button id="open">${t.choose}</button><button id="save" class="primary" disabled>${t.save}</button><input type="file" id="file" accept="image/*" hidden></div>
          <div class="examples"><label for="example">${t.samples}</label><select id="example">${t.names.map((s,i)=>`<option value="${i}">${s}</option>`).join('')}</select></div>
        </aside>
      </div>
      <div class="foot"><span>${t.privacy}</span><span id="notice" role="status" aria-live="polite"></span></div>
    </section>`;
  // Resolve references once; an in-flight callback can never address a subsequently remounted tool.
  const el = Object.fromEntries([...root.querySelectorAll('[id]')].map(node=>[node.id,node]));
  const view = el.preview, stage = el.stage, ctx = view.getContext('2d', {willReadFrequently:true});
  const cursor = root.querySelector('.focus-cursor'), life = new AbortController();
  const on = (target,event,handler)=>target.addEventListener(event,handler,{signal:life.signal});
  const delay = ()=>new Promise(ok=>setTimeout(ok,0));
  let source=null, srcName='', px=.5, py=.5, planes=null, original=false;
  let loadToken=0, frame=0, importing=false, saving=false;
  function note(value,error=false) { el.notice.textContent=value; el.notice.dataset.error=String(error); }
  function syncButtons() { el.save.disabled=!source||importing||saving; el.compare.disabled=!source||importing; }
  function options() { return {x:px,y:py,width:+el.width.value/100,blur:+el.blur.value/100,fade:+el.fade.value/100}; }
  function setCompare(value) { original=value; el.compare.setAttribute('aria-pressed',String(value)); el.compare.textContent=value?t.effect:t.original; }
  function draw() {
    if(frame||!planes) return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      const {w,h,bytes}=planes[0];
      if(original) ctx.putImageData(new ImageData(bytes,w,h),0,0);
      else { const r=renderer(planes,options()); r.run(0,h); ctx.putImageData(r.img,0,0); }
      el.coords.textContent=t.focus+' '+Math.round(px*100)+'% / '+Math.round(py*100)+'%';
    });
  }
  async function useImage(url,name,x,y,revoke=false) {
    const ticket=++loadToken; importing=true; syncButtons(); note(t.loading);
    try {
      const img=new Image(); img.src=url; await img.decode();
      if(ticket!==loadToken) return;
      const scale=Math.min(1,1050/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const data=pyramid(capture(img,w,h));
      source=img; srcName=name; px=x; py=y; planes=data; view.width=w; view.height=h; stage.dataset.portrait=String(h>w);
      setCompare(false); el['source-label'].textContent=name; el.size.textContent=img.naturalWidth+' × '+img.naturalHeight;
      note(''); draw();
    } catch { if(ticket===loadToken) note(t.badFile,true); }
    finally { if(revoke) URL.revokeObjectURL(url); if(ticket===loadToken){importing=false;syncButtons();} }
  }
  function example(i) { const s=samples[i]; el.example.selectedIndex=i; return useImage(asset(s.file),t.names[i],s.x,s.y); }
  function loadFile(f) { if(f){el.example.selectedIndex=-1;useImage(URL.createObjectURL(f),f.name,.5,.5,true);} }
  async function save() {
    if(saving||importing||!source) return;
    const img=source,s=options(),name=srcName.replace(/\.[A-Za-z0-9]{2,5}$/,'');
    const w=img.naturalWidth,h=img.naturalHeight;
    saving=true; syncButtons(); el.save.textContent=t.saving; note(t.preparing);
    try {
      await delay(); if(life.signal.aborted) return;
      const full=pyramid(capture(img,w,h)); await delay(); if(life.signal.aborted) return;
      const r=renderer(full,s),batch=Math.max(8,Math.floor(290000/w));
      for(let y=0;y<h;y+=batch){
        if(life.signal.aborted) return;
        r.run(y,Math.min(h,y+batch)); note(t.progress+' '+Math.round(Math.min(h,y+batch)*100/h)+'%'); await delay();
      }
      if(life.signal.aborted) return;
      const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').putImageData(r.img,0,0);
      const blob=await new Promise((ok,fail)=>c.toBlob(b=>b?ok(b):fail(new Error('PNG')),'image/png'));
      c.width=c.height=1; if(life.signal.aborted) return;
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url; a.download=name+t.suffix+'.png'; a.hidden=true; document.body.append(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000); note(t.done+' '+w+' × '+h+' PNG');
    } catch { if(!life.signal.aborted) note(t.failed,true); }
    finally { if(!life.signal.aborted){saving=false;el.save.textContent=t.save;syncButtons();} }
  }
  function hideCursor(){cursor.hidden=true;stage.classList.remove('has-focus-cursor');}
  function trackCursor(e){
    if(e.pointerType!=='mouse'||stage.classList.contains('drag')){hideCursor();return;}
    const rect=stage.getBoundingClientRect();
    cursor.style.transform='translate('+(e.clientX-rect.left)+'px,'+(e.clientY-rect.top)+'px)';
    cursor.hidden=false; stage.classList.add('has-focus-cursor');
  }
  for(const id of Object.keys(fields)) on(el[id],'input',()=>{el['v'+id].textContent=el[id].value+'%';setCompare(false);draw();});
  on(el.compare,'click',()=>{setCompare(!original);draw();});
  for(const type of ['pointerenter','pointermove','pointerdown']) on(view,type,trackCursor);
  for(const type of ['pointerleave','pointercancel','keydown']) on(view,type,hideCursor);
  on(window,'blur',hideCursor);
  on(view,'pointerdown',e=>{
    if(!source||e.button!==0)return;
    const b=view.getBoundingClientRect(); px=clamp((e.clientX-b.left)/b.width,0,1); py=clamp((e.clientY-b.top)/b.height,0,1);
    setCompare(false); draw();
  });
  on(view,'keydown',e=>{
    const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if(!d||!source)return;
    e.preventDefault(); const step=e.shiftKey?.05:.005;
    px=clamp(px+d[0]*step,0,1); py=clamp(py+d[1]*step,0,1); setCompare(false); draw();
  });
  on(el.open,'click',()=>el.file.click());
  on(el.file,'change',e=>{loadFile(e.target.files[0]);el.file.value='';});
  on(el.example,'change',()=>example(+el.example.value));
  on(el.save,'click',save);
  for(const ev of ['dragover','dragenter','dragleave','drop']) on(stage,ev,e=>{
    e.preventDefault(); const active=ev==='dragover'||ev==='dragenter';
    stage.classList.toggle('drag',active); if(active)hideCursor();
    if(ev==='drop')loadFile(e.dataTransfer.files[0]);
  });
  function dispose() {
    if(life.signal.aborted) return;
    life.abort(); ++loadToken; cancelAnimationFrame(frame); frame=0; planes=null; source=null;
    root.replaceChildren(); liveMounts.delete(host);
  }
  liveMounts.set(host,dispose); example(1);
  return dispose;
}
