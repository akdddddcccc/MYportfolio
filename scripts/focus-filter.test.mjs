// Both the native project page and standalone tool use this exact engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {pyramid,renderer,focusProfile,smootherstep} from '../public/apps/focus-filter/engine.mjs';
globalThis.ImageData ??= class { constructor(w,h){this.data=new Uint8ClampedArray(w*h*4)} };
// Opt-in integration check against a running static build. No browser/install needed for unit tests.
test('downloaded HTML works offline under file:// and never uploads a local photo', {skip:!process.env.FOCUS_TOOL_URL}, async()=>{
  const {chromium}=createRequire(import.meta.url)('playwright');
  const browser=await chromium.launch({headless:true,executablePath:process.env.FOCUS_BROWSER || undefined});
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'focus-offline-check-'));
  try {
    const file={name:'private-upload-not-for-package.png', mimeType:'image/png',
      buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWQ8AAAAASUVORK5CYII=','base64')};
    const online=await browser.newPage(); await online.goto(process.env.FOCUS_TOOL_URL);
    await online.locator('#compare:enabled').waitFor(); await online.locator('#file').setInputFiles(file);
    await online.getByText(file.name,{exact:true}).waitFor();
    const dl=online.waitForEvent('download'); await online.locator('#offline').click();
    const standalone=path.join(out,'filter offline.html'); await (await dl).saveAs(standalone);
    assert.ok(!fs.readFileSync(standalone,'utf8').includes(file.name));
    await online.close();
    const context=await browser.newContext({offline:true}); const page=await context.newPage();
    const requests=[],errors=[];
    page.on('request',r=>{if(/^https?:/.test(r.url()) || r.method()!=='GET')requests.push(r.method()+' '+r.url());});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(standalone).href); await page.locator('#compare:enabled').waitFor();
    await page.locator('#example').selectOption('0');
    await page.locator('#size').filter({hasText:'2080 × 1560'}).waitFor();
    await page.locator('#file').setInputFiles(file); await page.getByText(file.name,{exact:true}).waitFor();
    await page.locator('#compare').click(); assert.equal(await page.locator('#compare').getAttribute('aria-pressed'),'true');
    const png=page.waitForEvent('download'); await page.locator('#save').click();
    const exported=path.join(out,'export.png'); await (await png).saveAs(exported);
    const bytes=fs.readFileSync(exported); assert.equal(bytes.readUInt32BE(0),0x89504e47);
    assert.equal(bytes.readUInt32BE(16),1); assert.equal(bytes.readUInt32BE(20),1);
    assert.deepEqual(requests,[]); assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
});
test('the standalone entry uses the same local workbench without a nested document or inline photos',()=>{
  const base = new URL('../public/apps/focus-filter/', import.meta.url);
  const html = fs.readFileSync(new URL('index.html',base),'utf8');
  const workbench = fs.readFileSync(new URL('workbench.mjs',base),'utf8');
  assert.match(html,/import \{mountFocusFilter\} from '.\/workbench\.mjs'/);
  assert.doesNotMatch(html+workbench,/<iframe|data:image\/\w+;base64,/i);
  for(const name of ['materials.jpg','angles.jpg']){
    const photo=fs.readFileSync(new URL(name,base));
    assert.equal(photo.readUInt16BE(0),0xffd8);
    assert.equal(photo.readUInt16BE(photo.length-2),0xffd9);
  }
});
const options={x:.5,y:.5,width:.34,blur:.6,fade:.85};
function source(w,h,pixel){
  const bytes=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)bytes.set(pixel(x,y),4*(y*w+x));
  return {w,h,bytes};
}
function render(src,extra={}){
  const r=renderer(pyramid(src),{...options,...extra});r.run(0,src.h);
  return {at:(x,y)=>Array.from(r.img.data.slice((y*src.w+x)*4,(y*src.w+x)*4+4)),bytes:r.img.data};
}
test('no-op and focus core are byte-identical, including original alpha',()=>{
  const src=source(85,57,(x,y)=>[(x*7)%256,(y*6)%256,(x*y)%256,(5*x+3*y)%256]);
  assert.deepEqual(render(src,{blur:0,fade:0}).bytes,src.bytes);
  const {bytes}=render(src);
  for(let y=26;y<=30;y++)for(let x=40;x<=44;x++){
    const i=4*(y*src.w+x);assert.deepEqual(bytes.slice(i,i+4),src.bytes.slice(i,i+4))
  }
  for(let i=3;i<bytes.length;i+=4)assert.equal(bytes[i],src.bytes[i]);
});
test('a flat photo does not acquire a bright focus disc, a halo or banding from blur',()=>{
  const src=source(180,79,()=>[186,34,193,255]);
  assert.deepEqual(render(src,{blur:1,fade:0}).bytes,src.bytes);
});
test('blur does not sample transparent hidden colours',()=>{
  const src=source(120,80,(x,y)=>x>90?[0,0,255,255]:[255,0,0,0]);
  const {at}=render(src,{x:0,blur:1,fade:0});
  assert.deepEqual(at(91,40),[0,0,255,255]);
  assert.equal(at(89,40)[3],0);
});
test('desaturation preserves linear luminance; channels become equal at full distance',()=>{
  const lin=c=>{const s=c/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4};
  const Y=v=>.2126*lin(v[0])+.7152*lin(v[1])+.0722*lin(v[2]);
  const color=[220,65,38,255],src=source(321,81,()=>color);
  const {at}=render(src,{x:.1,blur:0,fade:1});let prev=Infinity;
  for(let x=32;x<321;++x){
    const v=at(x,40),spread=Math.max(...v.slice(0,3))-Math.min(...v.slice(0,3));
    assert.ok(Math.abs(Y(v)-Y(color))<.0029);assert.ok(spread<=prev+1);prev=spread
  }
  assert.deepEqual(at(32,40),color);assert.equal(prev,0);
});
test('independent, monotone responses: blur starts first and colour finishes later',()=>{
  for(const width of [0,.34,1]){
    const p=focusProfile(width);assert.ok(p.core<p.colorStart && p.blurEnd<p.colorEnd);
    const a=d=>smootherstep(p.core,p.blurEnd,d), b=d=>smootherstep(p.colorStart,p.colorEnd,d);
    assert.equal(a(p.core),0);assert.equal(b(p.colorStart),0);assert.ok(a(p.colorStart)>0);
    assert.equal(a(p.blurEnd),1);assert.ok(b(p.blurEnd)<1);assert.equal(b(p.colorEnd),1);
    let prevA=0,prevB=0;
    for(let d=0;d<=1.5;d+=.005){assert.ok(a(d)>=prevA-1e-12&&b(d)>=prevB-1e-12);prevA=a(d);prevB=b(d)}
  }
});
test('a distant fine checkerboard loses contrast without darkening white highlights',()=>{
  const src=source(247,91,(x,y)=>{const c=(x+y)%2?255:0;return[c,c,c,255]});
  const {at}=render(src,{x:0,y:.5,blur:1,fade:0});
  assert.deepEqual(at(0,44),[0,0,0,255]);assert.deepEqual(at(0,45),[255,255,255,255]);
  assert.ok(Math.abs(at(224,45)[0]-at(225,45)[0])<=2);
  assert.ok(Math.abs(at(224,45)[0]-188)<=2); // Half the light energy encoded into sRGB.
});
