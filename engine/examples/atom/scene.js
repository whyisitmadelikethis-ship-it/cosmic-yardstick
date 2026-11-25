// How small is an atom? One continuous zoom: fingertip -> skin -> a cell -> DNA -> one atom.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, logLerp, disc, shadedDisc, halo, dashRing, text } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tFinger=Wd('fingertip'), tZoom=Wd('zoom'), tSkin=Wd('skin'), tCell=Wd('cell'), tDNA=Wd('dna'), tHund=Wd('hundred'), tAtom=Wd('atom');
  // field of view (metres across the frame width), keyframes in log space
  const KF = [[0,0.05],[tZoom-0.1,0.036],[tSkin+0.2,2.2e-3],[tCell+0.25,9e-5],[tDNA+0.3,1.6e-7],[tDNA+0.55,1.3e-7],[tAtom-0.25,5.6e-10],[T.dur,5e-10]];
  function fov(t){ for(let i=0;i<KF.length-1;i++){ const [a,fa]=KF[i],[b,fb]=KF[i+1]; if(t<=b) return logLerp(fa,fb,eio(seg(t,a,b))); } return KF[KF.length-1][1]; }
  const CX=540, CY=880;
  const px=(m,F)=>m/F*K.W;              // metres -> pixels at this field of view
  // levels, nested at the zoom centre; each opaque
  const BIG=4*1920;
  function finger(F,t){ const w=px(0.016,F); if(w<2) return; if(w>BIG){ K.bg(C.cream); return; }
    // finger rising from the bottom, the tip centred on the zoom point
    K.g.save(); K.g.translate(CX, CY);
    K.g.fillStyle=C.creamS; K.g.beginPath(); K.g.roundRect(-w/2, -w/2, w, w*6, w/2); K.g.fill();
    K.g.fillStyle=C.cream; K.g.beginPath(); K.g.roundRect(-w/2-w*0.06, -w/2-w*0.06, w*0.92, w*6, w/2); K.g.fill();
    K.g.strokeStyle=C.creamS; K.g.lineWidth=Math.max(1.5,w*0.012); K.g.lineCap='round';
    for(let i=1;i<9;i++){ K.g.beginPath(); K.g.ellipse(0,w*0.05,w*0.05*i,w*0.042*i,0,Math.PI*1.05,Math.PI*1.95); K.g.stroke(); }  // fingerprint ridges
    K.g.restore(); }
  function skin(F,t){ const w=px(1.2e-3,F); if(w<3) return; if(w>BIG*0.6){ /* inside the skin: cells tile the frame */ }   // a patch of skin: cells tiled, a magnifier window
    K.g.save(); K.g.beginPath(); K.g.arc(CX,CY,w/2,0,7); K.g.clip(); disc(CX,CY,w/2,C.mintS);
    const s=px(3e-5,F); if(s>2){ const R=K.mulberry(5); for(let j=-22;j<=22;j++) for(let i=-22;i<=22;i++){ const x=CX+(i+(j%2)*0.5)*s*1.05, y=CY+j*s*0.92; if(Math.hypot(x-CX,y-CY)>w/2+s) continue; if(i===0&&j===0) continue;
      K.g.fillStyle=R()<0.5?C.mint:'#4ee0b8'; K.g.beginPath(); K.g.ellipse(x,y,s*0.48,s*0.44,R()*3,0,7); K.g.fill(); disc(x+s*0.08,y,s*0.12,C.blueS); } }
    K.g.restore(); dashRing(CX,CY,w/2+6,C.sun,4); }
  function cell(F,t){ const w=px(3e-5,F); if(w<3) return; if(w>BIG) K.bg(C.mint); else shadedDisc(CX,CY,w*0.48,C.mint,C.mintS);
    const n=px(6e-6,F); if(n>BIG) K.bg(C.blue); else shadedDisc(CX,CY,n*0.5,C.blue,C.blueS); }
  function dna(F,t){ const L=Math.min(px(1.6e-7,F),3000), wd=px(2.4e-9,F); if(wd<1.2||wd>2600) return;    // a double helix running across the nucleus
    K.g.save(); K.g.beginPath(); K.g.arc(CX,CY,Math.min(px(6e-6,F)*0.5,1e5),0,7); K.g.clip();
    const p=px(3.4e-9,F); // one turn = 3.4 nm
    for(const [ph,col] of [[0,C.coral],[Math.PI,C.sun]]){ K.g.strokeStyle=col; K.g.lineWidth=Math.max(2,wd*0.22); K.g.lineCap='round'; K.g.beginPath();
      for(let x=-L;x<=L;x+=Math.max(1,p/40)){ const y=Math.sin(x/p*2*Math.PI+ph+t*0.6)*wd/2; x===-L?K.g.moveTo(CX+x,CY+y):K.g.lineTo(CX+x,CY+y); } K.g.stroke(); }
    K.g.strokeStyle=C.cream; K.g.lineWidth=Math.max(1,wd*0.08); for(let x=-L;x<=L;x+=p/10){ const y=Math.sin(x/p*2*Math.PI+t*0.6)*wd/2; K.g.beginPath(); K.g.moveTo(CX+x,CY+y); K.g.lineTo(CX+x,CY-y); K.g.stroke(); }
    K.g.restore(); }
  function atom(F,t){ const r=Math.min(px(1.5e-10,F),2600); if(r<1.5) return;          // electron cloud ~0.3 nm; nucleus is a point at this scale
    disc(CX,CY,r*1.08,C.blueS); disc(CX,CY,r*0.95,C.night);
    for(let i=0;i<3;i++){ K.g.save(); K.g.translate(CX,CY); K.g.rotate(i*Math.PI/3+t*0.4); K.g.strokeStyle=C.mist; K.g.lineWidth=3; K.g.setLineDash([10,12]); K.g.beginPath(); K.g.ellipse(0,0,r*0.78,r*0.3,0,0,7); K.g.stroke(); K.g.restore();
      const a=t*3+i*2.1; disc(CX+Math.cos(a)*r*0.78*Math.cos(i*Math.PI/3+t*.4)-Math.sin(a)*r*0.3*Math.sin(i*Math.PI/3+t*.4), CY+Math.cos(a)*r*0.78*Math.sin(i*Math.PI/3+t*.4)+Math.sin(a)*r*0.3*Math.cos(i*Math.PI/3+t*.4), 9, C.blue); }
    disc(CX,CY,7,C.sun); }
  function render(t){
    const F=fov(t); K.bg();
    K.stars(1,0.18); finger(F,t); skin(F,t); cell(F,t); dna(F,t); atom(F,t);
    // one label per level, while that level fills the frame comfortably
    K.label(t,tFinger-0.2,'YOUR FINGERTIP','about 1.6 cm wide',CX+180,CY-160,CX+230,520,'left',tZoom+0.3);
    K.label(t,tSkin,'SKIN CELLS','each about 0.03 mm',CX+160,CY-200,CX+170,560,'left',tCell+0.05);
    K.label(t,tCell+0.1,'ONE CELL','its nucleus holds your DNA',CX+130,CY-120,CX+150,560,'left',tDNA-0.05);
    K.label(t,tDNA+0.05,'DNA','2.5 millionths of a mm wide',CX+150,CY-80,CX+160,560,'left',Wd('keep')+0.6);
    if(t>tHund-0.1){ const zoom=0.05/F; K.bigWord(t,tHund-0.1,'×'+(zoom>=1e6? Math.round(zoom/1e6)+' million': Math.round(zoom/1e3)+' thousand'),540,330,96,C.cream,1e9,true); }
    K.label(t,tAtom-0.15,'ONE ATOM','about 0.3 nanometres wide',CX+120,CY-300,CX+60,470);
    K.instrument('FIELD OF VIEW',K.fmtLen(F),clamp((Math.log(0.05)-Math.log(F))/(Math.log(0.05)-Math.log(1.1e-9))));
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:tZoom,type:'whoosh'},{t:tSkin+0.1,type:'pop'},{t:tCell+0.1,type:'pop'},{t:tDNA+0.1,type:'pop'},{t:Wd('keep'),type:'whoosh'},{t:tHund-0.1,type:'lock'},{t:tAtom-0.15,type:'ding'}];
  return { render, ev };
}
