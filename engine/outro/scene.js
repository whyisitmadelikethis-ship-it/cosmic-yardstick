// The channel outro (made once, appended to every Short): logo springs in, name rises, subscribe pill.
export function scene(K, T){
  const { C, seg, spr, eo, disc, shadedDisc, dashRing, rrect, text } = K;
  function logo(x,y,s){ const g=K.g; g.save(); g.translate(x,y); g.scale(s,s);
    disc(0,0,250,C.r1); disc(0,0,222,C.r2); shadedDisc(0,0,195,C.blue,C.blueS);
    g.save(); g.beginPath(); g.arc(0,0,195,0,7); g.clip(); disc(-70,-50,80,C.mint); disc(90,70,60,C.mint); g.restore();
    g.save(); g.rotate(-0.42); rrect(-292,-36,600,92,16,C.night); rrect(-300,-46,600,92,16,C.sun); g.fillStyle=C.sunS; g.fillRect(-300,26,600,20);
    g.strokeStyle=C.night; g.lineCap='round'; for(let i=0;i<=24;i++){ const x=-276+i*23, big=i%6===0; g.lineWidth=big?7:5; g.beginPath(); g.moveTo(x,-46); g.lineTo(x,-46+(big?44:i%3===0?30:18)); g.stroke(); } g.restore();
    disc(210,-215,22,C.cream); dashRing(210,-215,42,C.sun,6,[9,9]); g.restore(); }
  function render(t){ K.bg(); K.stars(1+t*0.05,0.18);
    const k=spr(seg(t,0,0.5)); logo(540,760,0.95*k);
    K.bigWord(t,0.22,'THE COSMIC',540,1220,92,C.cream);
    K.bigWord(t,0.32,'YARDSTICK',540,1325,92,C.sun);
    if(t>0.55){ const a=spr(seg(t,0.55,0.95)), w=760*a; rrect(540-w/2,1430,w,96,48,C.coral); if(a>0.97) text('SUBSCRIBE · NEW ONE DAILY',540,1494,40,C.cream,700,'center',2); }
  }
  return { render, ev:[] };
}
