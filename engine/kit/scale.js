// Scale Zoom Explainer kit (9:16). Flat, opaque shapes; one shade step; glow = two hard rings.
export const C = { night:'#1D2052', r1:'#252A63', r2:'#30367C', blue:'#4D7CFE', blueS:'#3A5FD9', mint:'#3FD8AE', mintS:'#22B38C',
  coral:'#FF6B5E', coralS:'#E14B45', sun:'#FFC84A', sunS:'#F2A12F', cream:'#FFF4E2', creamS:'#F0DCC0', mist:'#9298D4',
  day:'#4D7CFE', court:'#E8A15C', courtS:'#C9824A' };
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t, seg=(t,a,b)=>clamp((t-a)/(b-a));
export const eio=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, eo=t=>1-Math.pow(1-t,3), ei=t=>t*t*t;
export const spr=t=>{ if(t<=0) return 0; if(t>=1) return 1; return 1 - Math.cos(t*Math.PI*2.2)*Math.exp(-t*5.5)*(1-t); };
export const logLerp=(a,b,t)=>Math.exp(lerp(Math.log(a),Math.log(b),t));
export function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

export let g, W, H;
// Shorts safe zones: YouTube's buttons cover the right edge (x>960, y 900-1650) and the title/channel text covers y>1560.
// Keep anything important inside x 60-940, y 230-1520. Subtitles sit centred at SAFE.subY.
export const SAFE = { top:230, bottom:1520, right:940, subY:1470 };
export function setup(){ const cv=document.getElementById('c'); W=innerWidth||1080; H=innerHeight||1920; cv.width=W; cv.height=H; g=cv.getContext('2d'); return {g,W,H}; }
export function bg(col=C.night){ g.fillStyle=col; g.fillRect(0,0,W,H); }
export function disc(x,y,r,col){ if(r<=0) return; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle=col; g.fill(); }
export function shadedDisc(x,y,r,base,shade){ if(r<=0) return; disc(x,y,r,shade); g.save(); g.beginPath(); g.arc(x,y,r,0,7); g.clip(); disc(x-r*0.16,y-r*0.16,r,base); g.restore(); }
export function halo(x,y,r,k=1){ if(r<=0||k<=0) return; disc(x,y,r*(1+0.9*k),C.r1); disc(x,y,r*(1+0.45*k),C.r2); }
export function dashRing(x,y,r,col=C.sun,w=4,dash=[12,14]){ if(r<=0) return; g.save(); g.setLineDash(dash); g.lineWidth=w; g.lineCap='round'; g.strokeStyle=col; g.beginPath(); g.arc(x,y,r,0,7); g.stroke(); g.restore(); }
export function rrect(x,y,w,h,r,col){ g.beginPath(); g.roundRect(x,y,w,h,r); g.fillStyle=col; g.fill(); }

const STAR=(()=>{ const R=mulberry(11), s=[]; for(let i=0;i<190;i++) s.push({x:R()*1.8-.4, y:R()*1.5-.25, r:1.2+R()*2.6, c:R()}); return s; })();
export function stars(z=1, par=0.18, cx=0.5, cy=0.46){ const zz=Math.pow(z,par);
  for(const s of STAR){ const x=((s.x-cx)*zz+cx)*W, y=((s.y-cy)*zz+cy)*H; disc(x,y,s.r,[C.mist,C.cream,C.sun][Math.floor(s.c*3)]); } }
export function sparkle(x,y,s,ph,t){ const k=s*(1+0.16*Math.sin(t*2*Math.PI*0.3+ph)); g.fillStyle=C.cream; g.beginPath();
  g.moveTo(x,y-k); g.quadraticCurveTo(x,y,x+k*.32,y); g.quadraticCurveTo(x,y,x,y+k); g.quadraticCurveTo(x,y,x-k*.32,y); g.quadraticCurveTo(x,y,x,y-k); g.fill();
  g.beginPath(); g.moveTo(x-k*.7,y); g.quadraticCurveTo(x,y,x,y-k*.22); g.quadraticCurveTo(x,y,x+k*.7,y); g.quadraticCurveTo(x,y,x,y+k*.22); g.quadraticCurveTo(x,y,x-k*.7,y); g.fill(); }

export function text(s,x,y,size,col=C.cream,weight=700,align='left',track=0){ g.font=`${weight} ${size}px Geo`; g.fillStyle=col; g.textAlign=align; g.textBaseline='alphabetic'; g.letterSpacing=track+'px'; g.fillText(s,x,y); g.letterSpacing='0px'; }
// a label: small-caps tag above, one cream line below, 2.5px leader from (ax,ay); wipes left->right
export function label(t,t0,tag,line,ax,ay,lx,ly,align='left',t1=1e9){ if(t<t0||t>t1) return; const a=eo(seg(t,t0,t0+0.35));
  g.save(); g.beginPath(); if(align==='left') g.rect(0,0,lerp(Math.min(ax,lx)-10,W,a),H); else g.rect(lerp(Math.max(ax,lx)+10,0,a),0,W,H); g.clip();
  g.strokeStyle=C.mist; g.lineWidth=2.5; g.lineCap='round'; g.beginPath(); g.moveTo(ax,ay); g.lineTo(lx,ly+16); g.stroke();
  g.font='700 34px Geo'; const tw=Math.max(g.measureText(line).width, tag.length*16)+28;
  let tx = align==='left'? lx+10 : lx-10; if(align==='left' && tx+tw>W-30) tx=W-30-tw; if(align!=='left' && tx-tw<30) tx=30+tw;
  const bx = align==='left'? tx-14 : tx-tw+14; rrect(bx,ly-36,tw,104,14,C.night);
  text(tag,tx,ly,22,C.mist,600,align,3); text(line,tx,ly+48,34,C.cream,700,align); g.restore(); }
// a big number rising from below its own baseline (spring)
export function bigWord(t,t0,s,x,y,size=120,col=C.cream,t1=1e9,plate=false){ if(t<t0||t>t1) return; const k=spr(seg(t,t0,t0+0.55)); if(plate){ g.font=`700 ${size}px Geo`; const tw=g.measureText(s).width; rrect(x-tw/2-34,y-size*0.95,tw+68,size*1.25,24,C.night);} g.save(); g.beginPath(); g.rect(0,y-size*1.05,W,size*1.3); g.clip(); text(s,x,lerp(y+size*1.1,y,k),size,col,700,'center',-3); g.restore(); }
export function tagLine(t,t0,s,x,y,col=C.sun,t1=1e9){ if(t<t0||t>t1) return; const a=eo(seg(t,t0,t0+0.3)); g.save(); g.beginPath(); g.rect(0,0,W*a,H); g.clip(); text(s,x,y,24,col,600,'center',3); g.restore(); }

// corner instrument, top right: field of view + log ribbon
export function instrument(name,value,u){ if(window.NO_SUBS) return; const fx=W-150, fy=270; rrect(fx-330,fy-40,354,150,18,C.night); text(name,fx,fy,20,C.mist,600,'right',3); text(value,fx,fy+46,34,C.cream,700,'right');
  g.strokeStyle=C.r2; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(fx-300,fy+80); g.lineTo(fx,fy+80); g.stroke();
  for(let i=0;i<=6;i++) disc(fx-300+50*i,fy+80,3.5,C.r2); disc(fx-300+300*clamp(u),fy+80,9,C.sun); }
export function fmtLen(m){ const a=Math.abs(m);
  if(a>=1e12) return (m/1e12).toFixed(1)+' billion km'; if(a>=1e9) return (m/1e9).toFixed(m/1e9<10?1:0)+' million km'; if(a>=1e6) return (m/1e6).toFixed(0)+' thousand km'; if(a>=1e3) return Math.round(m/1e3).toLocaleString('en-US')+' km';
  if(a>=1) return m.toFixed(m<10?1:0)+' m'; if(a>=1e-2) return (m*100).toFixed(m*100<10?1:0)+' cm'; if(a>=1e-3) return (m*1e3).toFixed(1)+' mm';
  if(a>=1e-6) return (m*1e6).toFixed(m*1e6<10?1:0)+' µm'; return (m*1e9).toFixed(m*1e9<10?1:0)+' nm'; }

// subtitles: bottom-left, sun bar + one cream line; cues built from word timings, never wrapped
export function makeCues(T, maxChars=30){ const cues=[]; let cur=[], start=null;
  T.words.forEach((w,i)=>{ const nxt=(cur.concat(w.w)).join(' '); const end=/[.,!?]$/.test(w.w);
    if(cur.length && nxt.length>maxChars){ cues.push({t0:start,text:cur.join(' ')}); cur=[]; start=null; }
    if(start===null) start=w.t; cur.push(w.w); if(end && (/[.?!]$/.test(w.w) || cur.join(' ').length>14)){ cues.push({t0:start,text:cur.join(' ')}); cur=[]; start=null; } });
  if(cur.length) cues.push({t0:start,text:cur.join(' ')});
  cues.forEach((c,i)=>{ c.t0=Math.max(0,c.t0-0.05); c.t1=i<cues.length-1?cues[i+1].t0-0.05:T.dur; }); return cues; }
export function subtitles(t,cues){ if(window.NO_SUBS) return; for(const s of cues){ if(t<s.t0||t>=s.t1) continue; const k=eo(seg(t,s.t0,s.t0+0.16));
  g.save(); g.beginPath(); g.rect(0,SAFE.subY-110,W,200); g.clip(); const y=lerp(SAFE.subY+40,SAFE.subY,k); g.font='700 50px Geo'; const tw=g.measureText(s.text).width;
  rrect(W/2-tw/2-44,y-70,tw+88,104,18,C.night); g.fillStyle=C.sun; g.fillRect(W/2-tw/2-24,y-46,8,60); text(s.text,W/2+12,y,50,C.cream,700,'center'); g.restore(); } }

// word time lookup: Wd('cell') or Wd('then',2) for the 2nd occurrence
export function wordFinder(T){ return (w,n=1)=>{ let c=0; for(const x of T.words){ if(x.w.toLowerCase().replace(/[^a-z0-9']/g,'').startsWith(w.toLowerCase())){ c++; if(c===n) return x.t; } } throw new Error('word '+w); }; }

// the guide: a round sun-yellow body, one zoom-lens eye. look = angle (rad), lid 0..1 (blink), smile 0..1, s = scale
export function guide(x,y,s,o={}){ const {look=0,lid=0,smile=0,zoom=0,bob=0,ant=0}=o; g.save(); g.translate(x,y+bob); g.scale(s,s);
  g.strokeStyle=C.sunS; g.lineWidth=5; g.lineCap='round'; g.beginPath(); g.moveTo(0,-70); g.quadraticCurveTo(8+ant*10,-100,4+ant*14,-118); g.stroke(); disc(4+ant*14,-120,10,C.coral);
  shadedDisc(0,0,74,C.sun,C.sunS);
  disc(-56,8,13,C.coral); disc(56,8,13,C.coral);           // cheeks
  const ex=Math.cos(look)*14, ey=Math.sin(look)*10-6;
  disc(ex,ey,40+zoom*6,C.cream); disc(ex,ey,32+zoom*6,C.creamS);   // lens barrel
  disc(ex,ey,26,C.blueS); disc(ex-3,ey-3,24,C.blue);                  // iris (blue glass)
  if(smile>0){ g.strokeStyle=C.night; g.lineWidth=7; g.beginPath(); g.arc(ex,ey+8,14,Math.PI*1.15,Math.PI*1.85); g.globalAlpha=smile; g.stroke(); g.globalAlpha=1; }
  else { disc(ex+Math.cos(look)*6,ey+Math.sin(look)*5,11,C.night); disc(ex+Math.cos(look)*6-4,ey+Math.sin(look)*5-4,4,C.cream); }
  if(lid>0){ g.save(); g.beginPath(); g.arc(ex,ey,41,0,7); g.clip(); g.fillStyle=C.sunS; g.fillRect(ex-45,ey-45,90,90*lid); g.restore(); }
  g.restore(); return [x+Math.cos(look)*14*s, y+bob+(Math.sin(look)*10-6)*s]; }
export function blinkAt(t,times){ for(const b of times){ const d=t-b; if(d>=0&&d<0.18) return d<0.09? d/0.09 : 1-(d-0.09)/0.09; } return 0; }
// sight line: dots pop out one by one from a to b
export function sightLine(t,t0,a,b,n=12,col=C.sun){ if(t<t0) return; for(let i=0;i<n;i++){ const ti=t0+i*0.04; if(t<ti) break; const k=spr(seg(t,ti,ti+0.25)); const u=(i+0.5)/n+((t-t0)*0.04)%(1/n);
  disc(lerp(a[0],b[0],Math.min(u,1)),lerp(a[1],b[1],Math.min(u,1)),7*k*Math.min(1,(1-u)*6),col); } }

export async function boot(render, T, ev=[]){ window.DUR=T.dur; window.EV=ev; window.TEXTS=()=>[]; window.render=render;
  await document.fonts.load('700 40px Geo'); await document.fonts.load('600 40px Geo'); render(0); window.READY=true; }

// ---- hook + thumbnail helpers ----
// hookCard: the question at the top for the first seconds (frame 0 already shows it), springs in, wipes out at t1
export function hookCard(t, lines, t1=3.2, y=340){ if(t>t1+0.25) return; const k=t<=0.02?1:spr(seg(t,0,0.35)), out=eo(seg(t,t1,t1+0.25));
  g.save(); g.beginPath(); g.rect(0,0,W*(1-out),H); g.clip();
  const size=78; g.font=`700 ${size}px Geo`; const tw=Math.max(...lines.map(s=>g.measureText(s).width));
  rrect(W/2-tw/2-40, y-size*1.05, tw+80, size*1.25*lines.length+26, 26, C.night);
  lines.forEach((s,i)=>{ const yy=y+i*size*1.18; g.save(); g.beginPath(); g.rect(0,yy-size*1.05,W,size*1.3); g.clip();
    text(s,W/2,lerp(yy+size*1.1,yy,k),size,i===lines.length-1?C.sun:C.cream,700,'center',-2); g.restore(); });
  g.restore(); }
// thumbOverlay: big two-line question on a night plate + a red teaser pill, for the thumbnail frame
export function thumbOverlay(lines, teaser){ const size=104; g.font=`700 ${size}px Geo`;
  const tw=Math.min(W-60, Math.max(...lines.map(s=>g.measureText(s).width))+90);
  rrect(W/2-tw/2, 150, tw, size*1.2*lines.length+60, 30, C.night);
  lines.forEach((s,i)=>text(s,W/2,150+size*1.05+i*size*1.2,size,i===lines.length-1?C.sun:C.cream,700,'center',-3));
  if(teaser){ g.font='700 56px Geo'; const pw=g.measureText(teaser).width+90; rrect(W/2-pw/2,1560,pw,104,52,C.coral); text(teaser,W/2,1631,56,C.cream,700,'center',2); } }
