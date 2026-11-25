// How long is your DNA unwound? One nucleus -> the coil straightens while we zoom out to human size.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, spr, logLerp, disc, shadedDisc, halo, dashRing, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tDNA=Wd('dna'), tStr=Wd('stretch'), tTwo=Wd('two'), tTall=Wd('taller'), tYou=Wd('you',2);
  const CX=540, CY=860, FLOOR=1500, LX=360, LPX=830;          // line foot, line length in px once straight
  const F0=1.3e-5, F1=2.6;                                     // field of view: 13 µm -> 2.6 m
  const tZ0=tStr+0.1, tZ1=tTwo+0.1;
  const fov=t=> t<tZ0? logLerp(1.45e-5,F0,seg(t,0,tZ0)) : logLerp(F0,F1,eio(seg(t,tZ0,tZ1)));
  const px=(m,F)=>m/F*K.W;
  // the coil: a tangled random walk inside the nucleus (screen space, at F0)
  const R=K.mulberry(7), N=420, coil=[]; { let x=0,y=0,a=0; for(let i=0;i<N;i++){ a+= (R()-0.5)*1.4; x+=Math.cos(a)*14; y+=Math.sin(a)*14; const d=Math.hypot(x,y); if(d>200){ x*=200/d; y*=200/d; a+=Math.PI*0.7; } coil.push([x,y]); } }
  function render(t){
    const F=fov(t), s=F0/F;                                    // s: how much the cell has shrunk
    const cellR=px(1.5e-5,F), nucR=px(3e-6,F)*1.0;
    K.bg(); if(t>tZ0+0.6) K.stars(1,0.18);
    if(cellR>1500) K.bg(C.mint); else if(cellR>1) shadedDisc(CX,CY,cellR,C.mint,C.mintS);
    if(nucR>0.8) { shadedDisc(CX,CY,nucR,C.blue,C.blueS); }
    // the strand: coil -> morphs into a straight line
    const m=eio(seg(t,tStr,tStr+0.9));
    const pts=coil.map(([x,y],i)=>{ const cx=CX+x*Math.min(1,s*1.15)*(nucR/ (px(3e-6,F0)) >1?1:1), cy=CY+y*Math.min(1,s*1.15);
      const u=i/(N-1), lx=LX+Math.sin(u*90+t*3)*3, ly=FLOOR-u*LPX; return [lerp(cx,lx,m), lerp(cy,ly,m)]; });
    K.g.save(); if(m===0){ K.g.beginPath(); K.g.arc(CX,CY,nucR*0.97,0,7); K.g.clip(); }
    K.g.strokeStyle=C.coral; K.g.lineWidth=lerp(6,10,m); K.g.lineJoin='round'; K.g.lineCap='round'; K.g.beginPath(); pts.forEach(([x,y],i)=>i?K.g.lineTo(x,y):K.g.moveTo(x,y)); K.g.stroke(); K.g.restore();
    const L = m<1 ? lerp(2e-5,F*LPX/K.W,m*m) : F*LPX/K.W;       // what the strand measures
    // the person, and the floor
    if(t>tTall-0.15){ const a=spr(seg(t,tTall-0.15,tTall+0.4)), h=px(1.75,F)*a, x=740;
      K.g.fillStyle=C.mist; K.g.fillRect(120,FLOOR,840,6);
      K.g.save(); K.g.translate(x,FLOOR); const u=h/1.75;
      K.g.fillStyle=C.creamS; K.g.beginPath(); K.g.roundRect(-0.21*u,-1.48*u,0.42*u,0.68*u,0.12*u); K.g.fill();          // torso
      K.g.beginPath(); K.g.roundRect(-0.19*u,-0.86*u,0.17*u,0.86*u,0.07*u); K.g.fill(); K.g.beginPath(); K.g.roundRect(0.02*u,-0.86*u,0.17*u,0.86*u,0.07*u); K.g.fill();
      K.g.fillStyle=C.cream; K.g.beginPath(); K.g.roundRect(-0.30*u,-1.46*u,0.11*u,0.66*u,0.05*u); K.g.fill(); K.g.beginPath(); K.g.roundRect(0.19*u,-1.46*u,0.11*u,0.66*u,0.05*u); K.g.fill();
      disc(0,-1.62*u,0.12*u,C.cream); K.g.restore();
      // height marks
      const hp=px(1.75,F), dp=LPX; K.g.setLineDash([8,10]); K.g.lineWidth=3;
      K.g.strokeStyle=C.coral; K.g.beginPath(); K.g.moveTo(LX,FLOOR-dp); K.g.lineTo(960,FLOOR-dp); K.g.stroke();
      K.g.strokeStyle=C.mist; K.g.beginPath(); K.g.moveTo(x-80,FLOOR-hp*a); K.g.lineTo(960,FLOOR-hp*a); K.g.stroke(); K.g.setLineDash([]);
      if(a>0.9){ rrect(840,FLOOR-dp-62,200,50,12,C.night); text('DNA 2 m',940,FLOOR-dp-26,30,C.coral,700,'center');
        rrect(840,FLOOR-hp+12,200,50,12,C.night); text('you 1.75 m',940,FLOOR-hp+48,30,C.cream,700,'center'); } }
    // labels
    K.label(t,0.25,'ONE CELL','about 0.03 mm across',CX+300,CY-330,CX+40,300,'left',tDNA-0.1);
    K.label(t,tDNA-0.05,'YOUR DNA','packed in a 0.006 mm nucleus',CX+120,CY-100,CX-40,420,'left',tStr+0.2);
    if(t>tStr+0.9 && t<tTall-0.2) K.label(t,tStr+0.9,'THE SAME DNA','end to end',LX+8,FLOOR-LPX*0.55,LX+90,FLOOR-LPX*0.55-40,'left');
    K.bigWord(t,tTwo-0.05,'≈ 2 metres',540,300,110,C.cream,tTall-0.2,true);
    if(t>tStr) K.instrument('STRETCHED OUT',K.fmtLen(Math.min(2,L)),clamp(Math.log(L/2e-5)/Math.log(2/2e-5)));
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:tDNA-0.05,type:'pop'},{t:tStr,type:'whoosh'},{t:tTwo-0.05,type:'lock'},{t:tTall-0.15,type:'pop'},{t:tYou,type:'ding'}];
  return { render, ev };
}
