// How far away is the Moon? True scale: 1 px = 320 km. All the other planets, stacked, fill the gap.
export function scene(K, T){
  const { C, clamp, lerp, seg, eio, eo, spr, disc, shadedDisc, halo, text, rrect } = K;
  const Wd = K.wordFinder(T), cues = K.makeCues(T);
  const tIsnt=Wd("isn't"), tTake=Wd('take'), tAlmost=Wd('almost'), tGap=Wd('gap');
  const KM=320, EX=540, EY=250, MY=EY+384400/KM;           // Earth and Moon centres, true distance
  const PL=[['MERCURY',4879,C.mist,C.r2],['VENUS',12104,C.cream,C.creamS],['MARS',6779,C.coral,C.coralS],['JUPITER',139820,C.court,C.courtS],
            ['SATURN',116460,C.sun,C.sunS],['URANUS',50724,C.mint,C.mintS],['NEPTUNE',49244,C.blue,C.blueS]];
  let y=EY+6371/KM; const slots=PL.map(([n,d],i)=>{ const r=d/2/KM, c=y+r; y+=2*r; return {n,r,c,col:PL[i][2],sh:PL[i][3],t0:lerp(tTake+0.15,Wd('up')+0.05,i/6)}; });
  function render(t){
    K.bg(); K.stars(1,0.18);
    // the textbook picture, then the truth
    const k=eio(seg(t,tIsnt-0.05,tIsnt+0.55));
    const er=lerp(170,6371/KM,k), ex=EX, ey=lerp(760,EY,k), mr=lerp(48,1737/KM,k), mx=lerp(800,EX,k), my=lerp(800,MY,k);
    for(const s of slots){ if(t<s.t0) continue; const a=spr(seg(t,s.t0,s.t0+0.45)), r=s.r*a;
      if(s.n==='SATURN'){ K.g.save(); K.g.strokeStyle=C.sunS; K.g.lineWidth=Math.max(3,r*0.09); K.g.beginPath(); K.g.ellipse(EX,s.c,r*2.3,r*0.32,-0.12,0,7); K.g.stroke(); K.g.restore(); }
      shadedDisc(EX,s.c,r,s.col,s.sh);
      if(s.n==='JUPITER'&&r>40){ K.g.save(); K.g.beginPath(); K.g.arc(EX,s.c,r,0,7); K.g.clip(); for(const [dy,w] of [[-0.45,0.1],[-0.15,0.14],[0.2,0.1],[0.5,0.08]]) { K.g.fillStyle=C.courtS; K.g.fillRect(EX-r,s.c+dy*r,2*r,w*r); } disc(EX+r*0.35,s.c+r*0.3,r*0.12,C.coral); K.g.restore(); }
      if(a>0.6){ const side = s.r>150 ? null : (slots.indexOf(s)%2? 'r':'l');
        K.g.font='600 24px Geo'; const tw=K.g.measureText(s.n).width+28; const lx = side==='l'? EX-s.r-30-tw : side==='r'? EX+s.r+30 : EX-tw/2; const ly = side? s.c+9 : s.c+9;
        if(side){ K.g.strokeStyle=C.mist; K.g.lineWidth=2.5; K.g.beginPath(); K.g.moveTo(side==='l'?EX-s.r-6:EX+s.r+6,s.c); K.g.lineTo(side==='l'?lx+tw:lx,s.c); K.g.stroke(); }
        rrect(lx,ly-30,tw,42,12,C.night); text(s.n,lx+14,ly,24,C.cream,600,'left',3); } }
    halo(ex,ey,er,k<1?0.6:0.8); shadedDisc(ex,ey,er,C.blue,C.blueS);
    if(er>30){ K.g.save(); K.g.beginPath(); K.g.arc(ex,ey,er,0,7); K.g.clip(); disc(ex-er*0.3,ey-er*0.2,er*0.42,C.mint); disc(ex+er*0.4,ey+er*0.35,er*0.3,C.mint); K.g.restore(); }
    halo(mx,my,mr,0.6); shadedDisc(mx,my,mr,C.cream,C.creamS);
    if(t<tIsnt-0.05) K.tagLine(t,0.2,'HOW IT USUALLY LOOKS',540,1080,C.mist);
    if(t>tIsnt+0.5){
      K.label(t,tIsnt+0.5,'EARTH','true scale',EX+26,EY+10,EX+150,EY+40,'left',tTake+0.2);
      if(t<tAlmost) K.label(t,tIsnt+0.6,'THE MOON','384,400 km away',EX+14,MY-8,EX+150,MY-120,'left');
      K.instrument('SCALE','1 px = 320 km',0.5);
    }
    // the dimension: Earth to Moon vs the stack of planets
    if(t>tAlmost){ const a=eo(seg(t,tAlmost,tAlmost+0.7)), x=96, y0=EY, y1=lerp(EY,MY,a);
      K.g.strokeStyle=C.sun; K.g.lineWidth=5; K.g.lineCap='round'; K.g.beginPath(); K.g.moveTo(x,y0); K.g.lineTo(x,y1); K.g.moveTo(x-18,y0); K.g.lineTo(x+18,y0); if(a>0.98){K.g.moveTo(x-18,MY); K.g.lineTo(x+18,MY);} K.g.stroke();
      K.g.setLineDash([6,10]); K.g.lineWidth=2.5; K.g.strokeStyle=C.mist; K.g.beginPath(); K.g.moveTo(x+18,EY); K.g.lineTo(EX-30,EY); if(a>0.98){K.g.moveTo(x+18,MY); K.g.lineTo(EX-14,MY);} K.g.stroke(); K.g.setLineDash([]);
      if(a>0.5){ K.g.save(); K.g.translate(x,(EY+MY)/2); K.g.rotate(-Math.PI/2); K.g.font='700 32px Geo'; const tw=K.g.measureText('384,400 km').width; rrect(-tw/2-18,-26,tw+36,50,14,C.night); text('384,400 km',0,12,32,C.sun,700,'center'); K.g.restore(); }
      const b=eo(seg(t,tAlmost+0.4,tAlmost+1.1)), xr=984, yb=lerp(slots[0].c-slots[0].r,y,b);
      K.g.strokeStyle=C.mint; K.g.lineWidth=5; K.g.beginPath(); K.g.moveTo(xr,slots[0].c-slots[0].r); K.g.lineTo(xr,yb); K.g.stroke();
      if(b>0.5){ K.g.save(); K.g.translate(xr,(EY+MY)/2); K.g.rotate(Math.PI/2); K.g.font='700 32px Geo'; const s='7 planets: 380,000 km', tw=K.g.measureText(s).width; rrect(-tw/2-18,-26,tw+36,50,14,C.night); text(s,0,12,32,C.mint,700,'center'); K.g.restore(); }
    }
    K.bigWord(t,tGap-0.1,'99% of the gap',540,1560,72,C.cream,1e9,true);
    K.subtitles(t,cues);
  }
  const ev=[{t:0,type:'bed'},{t:tIsnt-0.05,type:'whoosh'},...slots.map(s=>({t:s.t0,type:'pop'})),{t:tAlmost,type:'whoosh'},{t:tGap-0.1,type:'ding'}];
  return { render, ev };
}
