// How small is an atom? One continuous zoom: fingertip -> ridges -> skin cells -> a nucleus -> DNA -> one atom, then back out.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, logLerp, disc, shadedDisc, dashRing, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T, 28);
  const tTen=Wd('ten'), tTh=Wd('thousand'), tTen2=Wd('ten',2), tMil=Wd('million'), tKeep=Wd('keep'), tHun=Wd('hundred'),
        tAtom=Wd('atom',2), tFing=Wd('fingertip',2), tAtoms=Wd('atoms'), tStars=Wd('stars'), hookEnd=T.lines[0].t1;
  const KF=[[0,0.05],[tTen-0.05,0.045],[tTen+0.9,5e-3],[tTh-0.05,4e-3],[tTh+1.0,5e-5],[tTen2-0.05,4.4e-5],[tTen2+0.9,1.0e-5],[tMil-0.05,9e-6],
            [tMil+1.0,7e-8],[tKeep,6e-8],[tAtom-0.15,6e-10],[tFing-0.1,5e-10],[tFing+1.1,0.05],[T.dur,0.047]];
  function fov(t){ for(let i=0;i<KF.length-1;i++){ const [a,fa]=KF[i],[b,fb]=KF[i+1]; if(t<=b) return logLerp(fa,fb,eio(seg(t,a,b))); } return KF[KF.length-1][1]; }
  const CX=540, CY=900, BIG=4*1920, px=(m,F)=>m/F*K.W;
  function finger(F){ const w=px(0.016,F); if(w<2) return; if(w>BIG){ K.bg(C.cream); ridges(F,w); return; }
    const g=K.g; g.save(); g.translate(CX,CY);
    g.fillStyle=C.creamS; g.beginPath(); g.roundRect(-w/2,-w/2,w,w*6,w/2); g.fill();
    g.fillStyle=C.cream; g.beginPath(); g.roundRect(-w/2-w*0.06,-w/2-w*0.06,w*0.92,w*6,w/2); g.fill(); g.restore(); ridges(F,w); }
  function ridges(F,w){ const g=K.g; g.save(); g.translate(CX,CY); g.strokeStyle=C.creamS; g.lineWidth=Math.max(1.5,w*0.012); g.lineCap='round';
    for(let i=1;i<9;i++){ if(w*0.05*i>4000) break; g.beginPath(); g.ellipse(0,w*0.05,w*0.05*i,w*0.042*i,0,Math.PI*1.05,Math.PI*1.95); g.stroke(); } g.restore(); }
  function skin(F,t){ const a=K.spr(seg(t,tTh-0.35,tTh+0.15)); const w=px(1.2e-3,F)*a; if(w<3) return; const g=K.g;
    g.save(); g.beginPath(); g.arc(CX,CY,Math.min(w/2,6000),0,7); g.clip(); disc(CX,CY,Math.min(w/2,6000),C.mintS);
    const s=px(3e-5,F); if(s>2){ const R=K.mulberry(5); for(let j=-22;j<=22;j++) for(let i=-22;i<=22;i++){ const x=CX+(i+(j%2)*0.5)*s*1.05, y=CY+j*s*0.92;
      if(x<-s||x>K.W+s||y<-s||y>K.H+s) { R(); R(); continue; } if(Math.hypot(x-CX,y-CY)>w/2+s) { R(); R(); continue; } if(i===0&&j===0) continue;
      g.fillStyle=R()<0.5?C.mint:'#4ee0b8'; g.beginPath(); g.ellipse(x,y,s*0.48,s*0.44,R()*3,0,7); g.fill(); disc(x+s*0.08,y,s*0.12,C.blueS); } }
    g.restore(); if(w<2000) dashRing(CX,CY,w/2+6,C.sun,4); }
  function cell(F){ const w=px(3e-5,F); if(w<3) return; if(w>BIG) K.bg(C.mint); else shadedDisc(CX,CY,w*0.48,C.mint,C.mintS);
    const n=px(6e-6,F); if(n>BIG) K.bg(C.blue); else shadedDisc(CX,CY,n*0.5,C.blue,C.blueS); }
  function dna(F,t){ const L=Math.min(px(1.6e-7,F),3000), wd=px(2.4e-9,F); if(wd<1.2||wd>2600) return; const g=K.g;
    g.save(); g.beginPath(); g.arc(CX,CY,Math.min(px(6e-6,F)*0.5,1e5),0,7); g.clip(); const p=px(3.4e-9,F);
    for(const [ph,col] of [[0,C.coral],[Math.PI,C.sun]]){ g.strokeStyle=col; g.lineWidth=Math.max(2,wd*0.22); g.lineCap='round'; g.beginPath();
      for(let x=-L;x<=L;x+=Math.max(1,p/40)){ const y=Math.sin(x/p*2*Math.PI+ph+t*0.6)*wd/2; x===-L?g.moveTo(CX+x,CY+y):g.lineTo(CX+x,CY+y); } g.stroke(); }
    g.strokeStyle=C.cream; g.lineWidth=Math.max(1,wd*0.08); for(let x=-L;x<=L;x+=p/10){ const y=Math.sin(x/p*2*Math.PI+t*0.6)*wd/2; g.beginPath(); g.moveTo(CX+x,CY+y); g.lineTo(CX+x,CY-y); g.stroke(); }
    g.restore(); }
  function atom(F,t){ const r=Math.min(px(1.5e-10,F),2600); if(r<1.5) return; const g=K.g;
    disc(CX,CY,r*1.08,C.blueS); disc(CX,CY,r*0.95,C.night);
    for(let i=0;i<3;i++){ const ro=i*Math.PI/3+t*0.4; g.save(); g.translate(CX,CY); g.rotate(ro); g.strokeStyle=C.mist; g.lineWidth=3; g.setLineDash([10,12]); g.beginPath(); g.ellipse(0,0,r*0.78,r*0.3,0,0,7); g.stroke(); g.restore();
      const a=t*3+i*2.1, ex=Math.cos(a)*r*0.78, ey=Math.sin(a)*r*0.3; disc(CX+ex*Math.cos(ro)-ey*Math.sin(ro), CY+ex*Math.sin(ro)+ey*Math.cos(ro), 9, C.blue); }
    disc(CX,CY,7,C.sun); }
  function zoomText(z){ if(z<1.5) return '×1'; if(z<1000) return '×'+String(Math.round(z/(z<100?1:10))*(z<100?1:10));
    if(z<1e6) return '×'+(Math.round(z/1000)*1000).toLocaleString('en-US'); return '×'+(z/1e6<10?(z/1e6).toFixed(1).replace('.0',''):Math.round(z/1e6))+' million'; }
  function render(t){
    const F=fov(t); K.bg(); K.stars(1,0.18);
    finger(F); skin(F,t); if(t>tTh-0.1) cell(F); dna(F,t); atom(F,t);
    K.hookCard(t,['HOW SMALL IS','AN ATOM?'],hookEnd);
    // the zoom counter (top centre) while we zoom
    if(t>hookEnd && t<tFing+0.2){ const z=0.05/F; const s=zoomText(z); K.g.font='700 64px Geo'; const tw=K.g.measureText(s).width;
      rrect(CX-tw/2-30,330,tw+60,96,22,C.night); text(s,CX,402,64,C.sun,700,'center'); text('ZOOM',CX,310,22,C.mist,600,'center',4); }
    // one label per level
    K.label(t,tTen+0.9,'FINGERPRINT RIDGES','each about half a millimetre',CX+60,CY-40,560,610,'left',tTh-0.1);
    K.label(t,tTh+1.0,'SKIN CELLS','each about 0.03 mm',CX+250,CY-200,560,610,'left',tTen2-0.1);
    K.label(t,tTen2+0.9,'ONE NUCLEUS','where your DNA lives',CX+200,CY-150,560,610,'left',tMil-0.1);
    K.label(t,tMil+1.0,'DNA','2.5 millionths of a mm wide',CX+160,CY-40,560,610,'left',tKeep+0.4);
    K.label(t,tAtom-0.1,'ONE ATOM','about 0.3 nanometres wide',CX+140,CY-160,560,610,'left',tFing-0.1);
    // the punchline: atoms in a fingertip vs stars in the galaxy
    if(t>tAtoms-0.1){ K.bigWord(t,tAtoms-0.1,'≈ 10²² atoms',CX,560,96,C.cream,1e9,true); }
    if(t>tStars-0.1){ K.bigWord(t,tStars-0.1,'Milky Way: ≈ 10¹¹ stars',CX,700,52,C.mist,1e9,true); }
        K.subtitles(t,cues);
  }
  const ev=[{t:hookEnd,type:'hook_end'},{t:tTen-0.05,type:'whoosh'},{t:tTen+0.9,type:'pop'},{t:tTh-0.05,type:'whoosh'},{t:tTh+1.0,type:'pop'},
    {t:tTen2-0.05,type:'whoosh'},{t:tTen2+0.9,type:'pop'},{t:tMil-0.05,type:'whoosh'},{t:tMil+1.0,type:'pop'},{t:tKeep,type:'whoosh'},
    {t:tAtom-0.1,type:'riser'},{t:tAtom-0.1,type:'payoff'},{t:tFing-0.1,type:'whoosh'},{t:tAtoms-0.1,type:'lock'},{t:tStars-0.1,type:'ding'}];
  return { render, ev };
}
