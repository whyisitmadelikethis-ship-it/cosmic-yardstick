// If the Sun were a basketball: Earth is a 2.2 mm pinhead, 26 m away, about one basketball court.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, spr, logLerp, disc, shadedDisc, halo, dashRing, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tBall=Wd('basketball'), tEarth=Wd('earth'), tPin=Wd('pinhead'), tAbout=Wd('about'), tSix=Wd('six'), tCourt=Wd('basketball',2);
  const BALL=0.24, EARTH=0.0022, DIST=26, CL=28.65, CWd=15.24;
  const s0=560/BALL, s1=44, by0=820, by1=380;                    // px per metre, ball screen y: close-up -> whole court
  const tz0=tAbout-0.05, tz1=tSix+0.6;
  function view(t){ const k=eio(seg(t,tz0,tz1)); return [logLerp(s0,s1,k), lerp(by0,by1,k)]; }
  function ball(x,y,r){ halo(x,y,r,0.4); shadedDisc(x,y,r,C.court,C.courtS);
    if(r<6) return; K.g.save(); K.g.beginPath(); K.g.arc(x,y,r,0,7); K.g.clip(); K.g.strokeStyle=C.night; K.g.lineWidth=Math.max(1.5,r*0.035);
    K.g.beginPath(); K.g.moveTo(x-r,y); K.g.lineTo(x+r,y); K.g.moveTo(x,y-r); K.g.lineTo(x,y+r); K.g.stroke();
    K.g.beginPath(); K.g.ellipse(x-r*1.05,y,r*0.55,r*1.1,0,-1.2,1.2); K.g.stroke(); K.g.beginPath(); K.g.ellipse(x+r*1.05,y,r*0.55,r*1.1,0,Math.PI-1.2,Math.PI+1.2); K.g.stroke(); K.g.restore(); }
  function court(t,s,by){ const a=eo(seg(t,tCourt-0.1,tCourt+0.6)); if(a<=0) return;
    const top=by-1.575*s, x0=540-CWd/2*s, w=CWd*s, h=CL*s;          // the ball sits where a hoop would be
    K.g.save(); K.g.beginPath(); K.g.rect(0,0,1080,top+h*a+4); K.g.clip();
    rrect(x0,top,w,h,6,'#2A2F6E');
    K.g.strokeStyle=C.cream; K.g.lineWidth=4; K.g.strokeRect(x0,top,w,h);
    K.g.beginPath(); K.g.moveTo(x0,top+h/2); K.g.lineTo(x0+w,top+h/2); K.g.stroke(); K.g.beginPath(); K.g.arc(540,top+h/2,1.8*s,0,7); K.g.stroke();
    for(const [yy,dir] of [[top,1],[top+h,-1]]){ K.g.strokeRect(540-2.45*s, dir>0?yy:yy-5.8*s, 4.9*s, 5.8*s); K.g.beginPath(); K.g.arc(540,yy+dir*1.575*s,6.75*s,dir>0?0.12:Math.PI+0.12,dir>0?Math.PI-0.12:2*Math.PI-0.12); K.g.stroke(); }
    K.g.restore(); }
  function render(t){
    const [s,by]=view(t); K.bg(); K.stars(1,0.18);
    court(t,s,by);
    const ey=by+DIST*s, er=Math.max(EARTH/2*s,3.5);
    // the tape: ball -> Earth
    if(t>tz0){ const a=eo(seg(t,tz0,tz1)), y1=lerp(by,ey,a);
      K.g.strokeStyle=C.sun; K.g.lineWidth=5; K.g.setLineDash([16,10]); K.g.beginPath(); K.g.moveTo(300,by); K.g.lineTo(300,Math.min(y1,1580)); K.g.stroke(); K.g.setLineDash([6,8]); K.g.strokeStyle=C.mist; K.g.lineWidth=2.5; K.g.beginPath(); K.g.moveTo(300,by); K.g.lineTo(540-BALL/2*s-8,by); if(y1>=ey-1&&ey<1580){K.g.moveTo(300,ey); K.g.lineTo(530,ey);} K.g.stroke(); K.g.setLineDash([]);
      const d=Math.min(DIST, (Math.min(y1,1580)-by)/s); K.instrument('DISTANCE',d<1? (d*100).toFixed(0)+' cm' : d.toFixed(d<10?1:0)+' m', d/DIST); }
    ball(540,by,BALL/2*s);
    if(ey<1700){ disc(540,ey,er,C.blue); if(t>tz1-0.2){ const k=spr(seg(t,tz1-0.2,tz1+0.3)); K.g.strokeStyle=C.sun; K.g.lineWidth=4; K.g.beginPath(); K.g.arc(540,ey,26*k,0,7); K.g.stroke(); } }
    // the magnifier: Earth beside a pin, same true size, x60
    if(t>tEarth-0.1 && t<tz0){ const a=spr(seg(t,tEarth-0.1,tEarth+0.4)), mx=540, my=1350, mr=165*a;
      disc(mx,my,mr+10,C.mist); disc(mx,my,mr,C.night); const z=52*a;
      K.g.save(); K.g.beginPath(); K.g.arc(mx,my,mr,0,7); K.g.clip();
      shadedDisc(mx-70,my,z,C.blue,C.blueS); disc(mx-70-z*0.3,my-z*0.2,z*0.4,C.mint);
      if(t>tPin-0.1){ const p=spr(seg(t,tPin-0.1,tPin+0.3)); K.g.fillStyle=C.mist; K.g.fillRect(mx+70-4,my+z*0.6,8,240*p); shadedDisc(mx+70,my,z*1.05*p,C.coral,C.coralS); }
      K.g.restore(); text('ZOOMED IN',mx-mr+20,my-mr+40,26,C.mist,600,'left',2);
      if(a>0.9){ text('EARTH',mx-70,my+z+44,24,C.cream,600,'center',3); if(t>tPin+0.2) text('PIN',mx+70,my-z-18,24,C.cream,600,'center',3); } }
    // labels
    K.label(t,0.25,'THE SUN','as a 24 cm basketball',540+BALL*0.35*s,by-BALL*0.35*s,700,360,'left',tEarth-0.2);
    if(t>tEarth-0.1 && t<tz0) K.label(t,tEarth+0.3,'EARTH','2.2 mm, a pinhead',650,1290,730,1200,'left');
    K.bigWord(t,tSix-0.1,'26 metres',720,1080,92,C.cream,tCourt-0.1,true);
    if(t>tz1) K.label(t,tz1,'EARTH','tiny dot, 26 m away',552,ey-8,640,ey-150,'left');
    if(t>tz1+0.2) K.label(t,tz1+0.2,'THE SUN','the basketball',534,by-4,90,250,'left');
    if(t>tCourt+0.5) K.label(t,tCourt+0.5,'A BASKETBALL COURT','28 m long',540,by+CL*s*0.5,620,by+CL*s*0.5-110,'left');
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:tEarth-0.1,type:'pop'},{t:tPin-0.1,type:'pop'},{t:tz0,type:'whoosh'},{t:tSix-0.1,type:'lock'},{t:tz1-0.2,type:'ding'},{t:tCourt-0.1,type:'whoosh'}];
  return { render, ev };
}
