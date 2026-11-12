// A .js suffix keeps native ESM executable on the static production host.
export const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);
function capture(img,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const cx=c.getContext('2d',{willReadFrequently:true});cx.imageSmoothingQuality='high';cx.drawImage(img,0,0,w,h);const d=cx.getImageData(0,0,w,h);c.width=c.height=1;return {w,h,bytes:d.data}}
// Keep the demo self-contained for offline use. All filtering and colour mixing
// below happens in linear light, with premultiplied alpha in the reduced planes.
const L16=65535,toLinear=new Float32Array(256),toSrgb=new Uint8Array(L16+1);
for(let i=0;i<256;i++){const s=i/255;toLinear[i]=s<=.04045?s/12.92:((s+.055)/1.055)**2.4}
for(let i=0;i<=L16;i++){const v=i/L16;toSrgb[i]=Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))}
function pyramid(src){let {w,h,bytes}=src;const layers=[{w,h,bytes}],k=[1,4,6,4,1];let base=true;
while(Math.min(w,h)>2 && layers.length<13){let nw=Math.ceil(w/2),nh=Math.ceil(h/2),a=new Uint16Array(nw*nh*4),tmp=new Float32Array(nw*4*5),tags=new Int32Array(5).fill(-1);
const rowFor=(sy)=>{sy=clamp(sy,0,h-1);const slot=sy%5;if(tags[slot]===sy)return slot*nw*4;tags[slot]=sy;
for(let x=0;x<nw;x++){const out=(slot*nw+x)*4;let r=0,g=0,b=0,al=0;for(let j=0;j<5;j++){const p=(sy*w+clamp(2*x+j-2,0,w-1))*4,ga=k[j];if(base){const wa=ga*bytes[p+3]*257;r+=toLinear[bytes[p]]*wa;g+=toLinear[bytes[p+1]]*wa;b+=toLinear[bytes[p+2]]*wa;al+=wa}else{r+=bytes[p]*ga;g+=bytes[p+1]*ga;b+=bytes[p+2]*ga;al+=bytes[p+3]*ga}}tmp[out]=r/16;tmp[out+1]=g/16;tmp[out+2]=b/16;tmp[out+3]=al/16}return slot*nw*4};
for(let y=0;y<nh;y++){const rows=[-2,-1,0,1,2].map(i=>rowFor(2*y+i));for(let x=0;x<nw;x++)for(let c=0;c<4;c++){let col=x*4+c;a[(y*nw+x)*4+c]=Math.round((tmp[rows[0]+col]+4*tmp[rows[1]+col]+6*tmp[rows[2]+col]+4*tmp[rows[3]+col]+tmp[rows[4]+col])/16)}}
w=nw;h=nh;bytes=a;base=false;layers.push({w,h,bytes})}
// Reconstruct broad defocus with cubic B-splines to avoid a square grid in highlights.
for(let l=3;l<layers.length;l++){const a=layers[l],uw=2*a.w-1,uh=2*a.h-1,tmp=new Float32Array(uw*a.h*4),up=new Uint16Array(uw*uh*4);
const weights=[[1/6,4/6,1/6,0],[1/48,23/48,23/48,1/48]];
for(let y=0;y<a.h;y++)for(let x=0;x<uw;x++){const k=weights[x%2],ix=x>>1;for(let c=0;c<4;c++){let n=0;for(let j=0;j<4;j++)n+=k[j]*a.bytes[(y*a.w+clamp(ix-1+j,0,a.w-1))*4+c];tmp[(y*uw+x)*4+c]=n}}
for(let y=0;y<uh;y++){const k=weights[y%2],iy=y>>1;for(let x=0;x<uw;x++)for(let c=0;c<4;c++){let n=0;for(let j=0;j<4;j++)n+=k[j]*tmp[(clamp(iy-1+j,0,a.h-1)*uw+x)*4+c];up[(y*uw+x)*4+c]=Math.round(n)}}layers[l]={w:uw,h:uh,bytes:up}}
return layers}
function sample(L,l,x,y,out){const a=L[l];
if(l===0){const p=(a.w*y+x)*4,al=a.bytes[p+3]*257;out[0]=toLinear[a.bytes[p]]*al;out[1]=toLinear[a.bytes[p+1]]*al;out[2]=toLinear[a.bytes[p+2]]*al;out[3]=al;return}
const s=2**(l>=3?l-1:l),xf=Math.min(x/s,a.w-1),yf=Math.min(y/s,a.h-1),i=Math.floor(xf),j=Math.floor(yf),u=xf-i,v=yf-j;
const p=(j*a.w+i)*4,q=(j*a.w+Math.min(i+1,a.w-1))*4,m=(Math.min(j+1,a.h-1)*a.w+i)*4,n=(Math.min(j+1,a.h-1)*a.w+Math.min(i+1,a.w-1))*4,d=a.bytes;
for(let c=0;c<4;c++)out[c]=(d[p+c]*(1-u)+d[q+c]*u)*(1-v)+(d[m+c]*(1-u)+d[n+c]*u)*v}
// Distances are fractions of the short side: moving focus doesn't stretch
// the field, and the same settings survive a change of export resolution.
function smootherstep(start,end,d){
  const t=clamp((d-start)/(end-start),0,1);
  return t*t*t*(10+t*(6*t-15));
}
function focusProfile(width){
  const core=.032+.20*width,blurEnd=.63+.45*width;
  return {core,blurEnd,colorStart:core+.065+.045*width,colorEnd:.86+.41*width};
}
function renderer(L,opt){
  const {w,h,bytes}=L[0],img=new ImageData(w,h),dst=img.data,short=Math.min(w,h);
  const cx=opt.x*(w-1),cy=opt.y*(h-1),p=focusProfile(opt.width);
  const maxSigma=short*.043*opt.blur**1.4,last=L.length-1;
  const n=4096,k=n/(short*p.colorEnd)**2;
  const levels=new Float32Array(n+2),loss=new Float32Array(n+2);
  for(let i=0;i<=n+1;i++){
    const d=Math.sqrt(i/n)*p.colorEnd;
    const sigma=maxSigma*smootherstep(p.core,p.blurEnd,d);
    levels[i]=Math.min(last,Math.log2(1+1.7*sigma));
    loss[i]=opt.fade*smootherstep(p.colorStart,p.colorEnd,d);
  }
  const a=[0,0,0,0],b=[0,0,0,0],c=[0,0,0,0];
  const encode=v=>toSrgb[Math.round(clamp(v,0,1)*L16)];
  return {img,run(y0,y1){
    if(opt.blur===0 && opt.fade===0){const s=y0*w*4;dst.set(bytes.subarray(s,y1*w*4),s);return}
    for(let y=y0;y<y1;y++){const dy=(y-cy)**2;for(let x=0;x<w;x++){
      const pos=(y*w+x)*4,d=Math.min(n,((x-cx)**2+dy)*k),j=Math.floor(d),u=d-j;
      const v=levels[j]+u*(levels[j+1]-levels[j]),fade=loss[j]+u*(loss[j+1]-loss[j]);
      const alpha=bytes[pos+3];dst[pos+3]=alpha;
      if(v===0 && fade===0){dst[pos]=bytes[pos];dst[pos+1]=bytes[pos+1];dst[pos+2]=bytes[pos+2];continue}
      let r,g,bl;
      if(v===0){r=toLinear[bytes[pos]];g=toLinear[bytes[pos+1]];bl=toLinear[bytes[pos+2]]}
      else{
        // Non-negative quadratic B-spline weights join adjacent Gaussian
        // bands with a continuous slope, including the join to the sharp core.
        const i=Math.floor(v),t=v-i,wa=.5*(1-t)**2,wc=.5*t*t,wb=1-wa-wc;
        sample(L,i,x,y,b);
        const left=i===0?b:a,right=i===last?b:c;
        if(left!==b)sample(L,i-1,x,y,left);
        if(right!==b)sample(L,i+1,x,y,right);
        const al=wa*left[3]+wb*b[3]+wc*right[3],inv=al>0?1/al:0;
        r=(wa*left[0]+wb*b[0]+wc*right[0])*inv;
        g=(wa*left[1]+wb*b[1]+wc*right[1])*inv;
        bl=(wa*left[2]+wb*b[2]+wc*right[2])*inv;
      }
      // Mix towards the neutral of equal linear luminance: no dark halo
      // when colourful paper, wood or highlights lose saturation.
      const Y=.2126*r+.7152*g+.0722*bl;
      dst[pos]=encode(r+(Y-r)*fade);dst[pos+1]=encode(g+(Y-g)*fade);dst[pos+2]=encode(bl+(Y-bl)*fade);
    }}
  }};
}
export {capture, pyramid, renderer, focusProfile, smootherstep};
