// What if Earth stopped spinning? The ground stops; the air keeps going east at ~1,670 km/h.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, spr, disc, shadedDisc, halo, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tSix=Wd('sixteen'), tStop=Wd('stopped'), tAir=Wd('air'), tEast=Wd('east'), tFast=Wd('faster');
  const CX=540, CY=840, RE=360, W0=0.55;                       // globe, spin rate (rad/s, for show)
  // made-up continents as blobs on the sphere: [lat, lon, radius(deg)]
  const LAND=[[45,-100,24],[15,-80,10],[-15,-60,20],[50,15,14],[5,20,24],[-20,25,14],[55,90,30],[25,80,14],[-25,135,14],[65,-40,10],[30,110,12]];
  const CLOUD=(()=>{ const R=K.mulberry(4), a=[]; for(let i=0;i<16;i++) a.push([ -50+R()*100, R()*360-180, 10+R()*16 ]); return a; })();
  const rad=Math.PI/180;
  function rotAt(t){ // ground rotation angle; spins, then stops dead
    const ts=tStop-0.05; if(t<ts) return W0*t; const d=Math.min(t-ts,0.35); return W0*ts + W0*(d - d*d/(2*0.35)); }
  function proj(lat,lon,rot){ const la=lat*rad, lo=lon*rad+rot; const x=Math.cos(la)*Math.sin(lo), y=-Math.sin(la), z=Math.cos(la)*Math.cos(lo); return [CX+x*RE, CY+y*RE, z]; }
  function blob(lat,lon,r,rot,col,sx=1){ const pts=[]; let vis=false; for(let i=0;i<40;i++){ const a=i/40*Math.PI*2; const p=proj(lat+Math.sin(a)*r, lon+Math.cos(a)*r*sx/Math.max(0.3,Math.cos(lat*rad)),rot); if(p[2]>0) vis=true; if(p[2]<0){ const d=Math.hypot(p[0]-CX,p[1]-CY)||1; p[0]=CX+(p[0]-CX)/d*RE; p[1]=CY+(p[1]-CY)/d*RE; } pts.push(p); }
    if(!vis) return; K.g.fillStyle=col; K.g.beginPath(); pts.forEach(([x,y],i)=>i?K.g.lineTo(x,y):K.g.moveTo(x,y)); K.g.closePath(); K.g.fill(); }
  function render(t){
    K.bg(); K.stars(1,0.18);
    const rg=rotAt(t), ra=W0*t;                                  // ground, air
    halo(CX,CY,RE,0.35); disc(CX,CY,RE,C.blueS);
    K.g.save(); K.g.beginPath(); K.g.arc(CX,CY,RE,0,7); K.g.clip(); disc(CX-RE*0.06,CY-RE*0.06,RE,C.blue);
    for(const [la,lo,r] of LAND) blob(la,lo,r,rg,C.mint);
    // equator
    K.g.save(); K.g.setLineDash([14,14]); K.g.lineDashOffset=-rg*RE; K.g.strokeStyle=C.sun; K.g.lineWidth=5; K.g.beginPath(); K.g.moveTo(CX-RE,CY); K.g.lineTo(CX+RE,CY); K.g.stroke(); K.g.restore();
    // clouds = the air; they ride with the ground until it stops
    for(const [la,lo,r] of CLOUD) blob(la,lo,r*0.22,ra,C.cream,3);
    K.g.restore();
    // after the stop: speed streaks over the globe heading east (to the right)
    if(t>tAir-0.1){ const a=eo(seg(t,tAir-0.1,tAir+0.3)); const R=K.mulberry(12);
      for(let i=0;i<22;i++){ const y=CY-RE*0.9+R()*RE*1.8, sp=900+R()*500, L=(80+R()*140)*a, x=((R()*1400+t*sp)%1400)-160;
        K.g.strokeStyle=i%3?C.cream:C.mist; K.g.lineWidth=5; K.g.lineCap='round'; K.g.beginPath(); K.g.moveTo(x,y); K.g.lineTo(x+L,y); K.g.stroke(); } }
    // read-outs
    const gv = t<tStop-0.05 ? 1670 : Math.round(1670*(1-Math.min(1,(t-tStop+0.05)/0.35)));
    K.instrument('GROUND AT EQUATOR', gv.toLocaleString('en-US')+' km/h', gv/1670);
    K.label(t,Wd('equator')-0.05,'THE EQUATOR','40,000 km around',CX+RE*0.75,CY,CX+120,CY-RE-150,'left',tSix-0.1);
    K.bigWord(t,tSix-0.05,'1,670 km/h',540,330,110,C.sun,tStop-0.1,true);
    if(t>tStop-0.05) K.bigWord(t,tStop-0.05,'STOP',540,330,120,C.coral,tAir+0.4,true);
    if(t>tAir+0.4 && t<tFast-0.1) K.label(t,tAir+0.4,'THE AIR','still moving east',CX+RE*0.5,CY-RE*0.45,CX+40,300,'left');
    if(t>tEast-0.1 && t<tFast-0.1){ const a=eo(seg(t,tEast-0.1,tEast+0.3)); rrect(800-60,1290,250*a+60,70,16,C.night); K.g.fillStyle=C.sun; K.g.beginPath(); K.g.moveTo(820+220*a,1325); K.g.lineTo(790+220*a,1305); K.g.lineTo(790+220*a,1345); K.g.fill(); text('EAST',770,1337,32,C.cream,700,'left',4); }
    // the comparison bars: wind vs a jet airliner
    if(t>tFast-0.1){ const a=eo(seg(t,tFast-0.1,tFast+0.5)), x0=70, wMax=720;
      rrect(40,1250,1000,300,24,C.night);
      text('WIND',x0,1300,24,C.mist,600,'left',3); rrect(x0,1316,wMax*a,46,12,C.coral); text('1,670 km/h',x0+wMax*a+16,1352,34,C.cream,700);
      text('JET AIRLINER',x0,1420,24,C.mist,600,'left',3); rrect(x0,1436,wMax*900/1670*a,46,12,C.mist); text('~900 km/h',x0+wMax*900/1670*a+16,1472,34,C.cream,700); }
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:Wd('equator')-0.05,type:'pop'},{t:tSix-0.05,type:'lock'},{t:tStop-0.05,type:'thump'},{t:tAir-0.1,type:'whoosh'},{t:tEast-0.1,type:'pop'},{t:tFast-0.1,type:'ding'}];
  return { render, ev };
}
