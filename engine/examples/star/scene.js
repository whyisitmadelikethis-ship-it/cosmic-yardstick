// How big is the biggest star? Sun close-up -> pull back to meet UY Scuti -> drop it in the Sun's place.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, spr, logLerp, disc, shadedDisc, halo, dashRing, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tUY=Wd('uy'), tBig=Wd('biggest'), tPut=Wd('put'), tSw=Wd('swallow');
  const RS=696000, RU=909*RS, AU=1.496e8, CX=540, CY=840;
  const XU0 = RS + 0.08e9 + RU;                                    // UY Scuti parked right beside the Sun
  const PL=[['MERCURY',0.39,C.mist,Wd('mercury')],['VENUS',0.72,C.cream,Wd('venus')],['EARTH',1.0,C.blue,Wd('earth')],['MARS',1.52,C.coral,Wd('mars')],['JUPITER',5.2,C.court,1e9]];
  const tMars=Wd('mars');
  function cam(t){   // [camera x in km, field of view in km]; the pan follows the zoom so the Sun stays in frame
    if(t<tUY-0.6) return [0, logLerp(2.6e6,2.2e6,seg(t,0,tUY-0.6))];
    if(t<tPut) { const F=logLerp(2.2e6,2.75e9,eio(seg(t,tUY-0.6,tBig))); return [0.153*(F-2.2e6), F]; }
    const k=eio(seg(t,tPut,tPut+1.2)), cx=lerp(0.42e9,0,k);
    let F=logLerp(2.75e9,1.85e9,k);
    F=logLerp(F,4.6*AU,eio(seg(t,tPut+1.0,tSw+0.3)));
    F=logLerp(F,1.85e9,eio(seg(t,tMars+0.15,tMars+0.75)));
    return [cx,F]; }
  function render(t){
    const [cx,F]=cam(t), s=K.W/F, X=wx=>CX+(wx-cx)*s;
    K.bg(); K.stars(1,0.18);
    // the Sun
    const sr=RS*s, sx=X(0);
    if(sr>3){ halo(sx,CY,sr,0.5); shadedDisc(sx,CY,sr,C.sun,C.sunS);
      if(sr>60){ const R=K.mulberry(3); K.g.save(); K.g.beginPath(); K.g.arc(sx,CY,sr,0,7); K.g.clip(); for(let i=0;i<26;i++){ const a=R()*7, d=Math.sqrt(R())*sr*0.9; disc(sx+Math.cos(a)*d,CY+Math.sin(a)*d,sr*(0.04+R()*0.05),C.sunS);} K.g.restore(); } }
    else disc(sx,CY,4,C.sun);
    // UY Scuti: parked beside the Sun, then slides into its place
    const mv=eio(seg(t,tPut,tPut+1.2)), ux=X(lerp(XU0,0,mv)), ur=RU*s;
    if(ux-ur<K.W+50){ halo(ux,CY,ur,0.35); shadedDisc(ux,CY,ur,C.coral,C.coralS);
      const R=K.mulberry(9); K.g.save(); K.g.beginPath(); K.g.arc(ux,CY,ur,0,7); K.g.clip(); for(let i=0;i<14;i++){ const a=R()*7, d=Math.sqrt(R())*ur*0.85; disc(ux+Math.cos(a)*d,CY+Math.sin(a)*d,ur*(0.06+R()*0.08),C.coralS);} K.g.restore(); }
    // the Sun still shows through as a dot once covered
    if(mv>0.5 && sr<=3) { disc(sx,CY,6,C.sun); }
    // orbits appear once the star is in place; each swallowed on its name
    if(t>tPut+0.3){ PL.forEach(([n,au,col,tw],i)=>{ const t0=tPut+0.3+i*0.12; if(t<t0) return; const r=au*AU*s, a=eo(seg(t,t0,t0+0.4));
      if(t>=tw){ const d=t-tw; if(d<0.35){ const k=eo(d/0.35); K.g.strokeStyle=C.cream; K.g.lineWidth=6*(1-k); K.g.beginPath(); K.g.arc(sx,CY,r*(1+0.25*k),0,7); K.g.stroke(); } return; }
      K.g.save(); K.g.setLineDash([10,12]); K.g.lineWidth=3; K.g.strokeStyle=i===4?C.mist:C.cream; K.g.beginPath(); K.g.arc(sx,CY,r,-Math.PI/2,-Math.PI/2+a*Math.PI*2); K.g.stroke(); K.g.restore();
      const ang=-0.6-i*0.55+t*0.15/(au); if(a>0.9){ const px_=sx+Math.cos(ang)*r, py_=CY+Math.sin(ang)*r; disc(px_,py_,i===4?14:9,col); if(r>90&&i<4){ K.g.font='600 22px Geo'; const tw=K.g.measureText(n).width+24; rrect(px_+16,py_-18,tw,36,10,C.night); text(n,px_+28,py_+8,22,C.cream,600,'left',2); } } }); }
    // labels
    K.label(t,0.25,'OUR SUN','1.4 million km wide',CX+150,CY-260,CX+60,360,'left',tUY-0.7);
    K.label(t,tUY+0.55,'UY SCUTI','one of the largest stars known',ux-ur*0.4,CY-ur*0.7,ux-300,Math.max(330,CY-ur-140),'left',tPut);
    if(t>tUY && t<tPut){ const a=spr(seg(t,tUY+0.4,tUY+0.8)); K.g.strokeStyle=C.sun; K.g.lineWidth=4; K.g.beginPath(); K.g.arc(sx,CY,22*a,0,7); K.g.stroke(); K.label(t,tUY+0.4,'THE SUN','that dot',sx,CY+24,sx-20,CY+170,'left',tPut); }
    K.bigWord(t,tBig-0.05,'≈ 900× wider',540,1460,96,C.cream,tPut+0.6,true);
    if(t>tMars+0.5) K.label(t,tMars+0.5,'JUPITER',"just out of reach",X(0)+5.2*AU*s*0.71,CY-5.2*AU*s*0.71,X(0)+90,300,'left');
    K.instrument('FIELD OF VIEW',K.fmtLen(F*1000),clamp(Math.log(F/2.6e6)/Math.log(2.75e9/2.6e6)));
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:tUY-0.6,type:'whoosh'},{t:tUY+0.5,type:'thump'},{t:tBig-0.05,type:'lock'},{t:tPut,type:'whoosh'},...PL.slice(0,4).map(p=>({t:p[3],type:'pop'})),{t:Wd('mars')+0.3,type:'ding'}];
  return { render, ev };
}
