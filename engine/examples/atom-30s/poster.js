// Thumbnail poster (reference). Copy to work/<ID>/web/poster.js, then: node tools/render.mjs frame work/<ID>/web <out.jpg> 0 "poster=1"
// CY-2026-11-26: a zoom tunnel inside a fingerprint whorl.
// fingerprint -> skin cells -> nucleus with DNA -> one atom, nested as rings around one centre.
export function poster(K){
  const { C, g, disc, shadedDisc, text, rrect } = K, W=1080, H=1920, cx=540, cy=1070;
  const ring=(r,w=16)=>{ g.strokeStyle=C.night; g.lineWidth=w; g.beginPath(); g.arc(cx,cy,r,0,7); g.stroke(); };
  const clipAnn=(r0,r1)=>{ g.save(); g.beginPath(); g.moveTo(cx+r1,cy); g.arc(cx,cy,r1,0,Math.PI*2); g.moveTo(cx+r0,cy); g.arc(cx,cy,r0,Math.PI*2,0,true); g.clip(); };
  // 1. fingerprint whorl, full bleed
  K.bg(C.cream);
  g.strokeStyle=C.creamS; g.lineCap='round';
  for(let i=1;i<40;i++){ const r=36*i; g.lineWidth=15; g.beginPath(); g.ellipse(cx+6*Math.sin(i),cy+i*3,r*1.06,r,0.12,0.15+0.02*i,Math.PI*2-0.05); g.stroke(); }
  // 2. skin cells
  const R1=500, R2=360, R3=245, R4=150;
  disc(cx,cy,R1,C.mintS); clipAnn(R2,R1); const rnd=K.mulberry(7);
  for(let j=-8;j<=8;j++) for(let i=-8;i<=8;i++){ const x=cx+(i+(j&1)*0.5)*118, y=cy+j*104; if(Math.hypot(x-cx,y-cy)>R1+70) continue;
    g.fillStyle=rnd()<0.5?C.mint:'#4ee0b8'; g.beginPath(); g.ellipse(x,y,54,49,rnd()*3,0,7); g.fill(); disc(x+8,y-4,15,C.blueS); }
  g.restore(); ring(R1,18);
  // 3. nucleus with a coiled DNA ring
  shadedDisc(cx,cy,R2,C.blue,C.blueS); clipAnn(R3,R2);
  const rm=(R2+R3)/2, amp=34, n=14;
  for(const [ph,col] of [[0,C.coral],[Math.PI,C.sun]]){ g.strokeStyle=col; g.lineWidth=13; g.beginPath();
    for(let k=0;k<=720;k++){ const a=k/720*Math.PI*2, r=rm+Math.sin(a*n+ph)*amp; k?g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } g.stroke(); }
  g.strokeStyle=C.cream; g.lineWidth=5;
  for(let k=0;k<n*4;k++){ const a=k/(n*4)*Math.PI*2, s=Math.sin(a*n)*amp; g.beginPath(); g.moveTo(cx+Math.cos(a)*(rm+s),cy+Math.sin(a)*(rm+s)); g.lineTo(cx+Math.cos(a)*(rm-s),cy+Math.sin(a)*(rm-s)); g.stroke(); }
  g.restore(); ring(R2,16);
  // 4. one atom, glowing
  disc(cx,cy,R3,C.night); disc(cx,cy,R3-16,C.r1); disc(cx,cy,R3-46,C.r2); disc(cx,cy,R4+30,C.night);
  ring(R3,16);
  for(let i=0;i<3;i++){ const ro=i*Math.PI/3+0.35; g.save(); g.translate(cx,cy); g.rotate(ro); g.strokeStyle=C.mist; g.lineWidth=5; g.setLineDash([14,12]);
    g.beginPath(); g.ellipse(0,0,R4*1.2,R4*0.42,0,0,7); g.stroke(); g.restore();
    const a=i*2.2+0.5, ex=Math.cos(a)*R4*1.2, ey=Math.sin(a)*R4*0.42; disc(cx+ex*Math.cos(ro)-ey*Math.sin(ro), cy+ex*Math.sin(ro)+ey*Math.cos(ro), 15, C.mint); }
  disc(cx,cy,34,C.r2); shadedDisc(cx,cy,24,C.sun,C.sunS);
  // headline
  rrect(80,130,920,330,34,C.night);
  text('YOUR FINGERTIP, ZOOMED', cx, 222, 50, C.mist, 700, 'center', 3);
  text('100,000,000×', cx, 380, 132, C.sun, 700, 'center', -4);
  // teaser
  g.font='700 60px Geo'; const tw=g.measureText('KEEP ZOOMING').width+110;
  rrect(cx-tw/2,1640,tw,116,58,C.coral); text('KEEP ZOOMING',cx,1719,60,C.cream,700,'center',3);
}
