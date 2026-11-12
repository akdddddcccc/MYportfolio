// Package only these shipped assets, never the photo or settings currently in the editor.
const formats = {
  'engine.mjs':'text/javascript', 'workbench.css':'text/css',
  'materials.jpg':'image/jpeg', 'angles.jpg':'image/jpeg',
};
async function read(name) {
  const response=await fetch(new URL(name,import.meta.url),{mode:'same-origin'});
  if(!response.ok || (name!=='index.html' && response.headers.get('content-type')?.includes('text/html'))) throw new Error(name);
  return response;
}
async function dataURL(name,type) {
  const blob=new Blob([await (await read(name)).arrayBuffer()],{type});
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(blob);
  });
}
export async function downloadOffline(lang) {
  const [shell, code, entries]=await Promise.all([
    read('index.html').then(r=>r.text()),
    read('workbench.mjs').then(r=>r.text()),
    Promise.all(Object.entries(formats).map(async ([name,type])=>[name,await dataURL(name,type)])),
  ]);
  const assets=Object.fromEntries(entries),doc=new DOMParser().parseFromString(shell,'text/html');
  doc.querySelectorAll('script,footer,link[rel="modulepreload"]').forEach(el=>el.remove());
  if(lang==='en'){
    doc.documentElement.lang='en';
    doc.querySelector('h1').textContent=doc.title='Focus · Offline Photo Filter';
  }
  // An inline module shares the HTML file's base URL. Import maps let the exact
  // original workbench import the exact original engine with no file:// fetch.
  const imports=doc.createElement('script'); imports.type='importmap';
  imports.textContent=JSON.stringify({imports:{'./engine.mjs':assets['engine.mjs']}});
  delete assets['engine.mjs']; doc.head.append(imports);
  const app=doc.createElement('script'); app.type='module';
  app.textContent=code+'\nconst offlineAssets='+JSON.stringify(assets)+';\nmountFocusFilter(document.getElementById("tool"),{lang:'+JSON.stringify(lang==='en'?'en':'zh')+',asset:file=>offlineAssets[file]});';
  doc.body.append(app);
  const url=URL.createObjectURL(new Blob(['<!doctype html>\n',doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));
  const link=document.createElement('a'); link.hidden=true; link.href=url; link.download='focus-filter-offline.html';
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
