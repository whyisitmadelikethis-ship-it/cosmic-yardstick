# Writes the outro sting (1.8 s): a soft whoosh as the logo springs in, a bright bell chord on the subscribe pill.
import sys, numpy as np, soundfile as sf
sys.argv = [sys.argv[0], '/dev/null']          # mix.py helpers only
exec(open(__file__.replace('outro_audio.py', 'mix.py')).read().split('# ---------- music bed ----------')[0])
buf = np.zeros((int(1.8 * SR), 2))
add(buf, whoosh(0.6), 0.0, 0.5)
add(buf, pop(), 0.22, 0.3); add(buf, pop(), 0.32, 0.25, pan=0.2)
for i, iv in enumerate((0, 4, 7, 12)): add(buf, ding(76 + iv), 0.55 + i * 0.03, 0.22, pan=(i - 1.5) * 0.2)
add(buf, thump(), 0.0, 0.35)
buf *= np.clip((1.8 - np.arange(len(buf)) / SR) / 0.25, 0, 1)[:, None]
sf.write(sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != '/dev/null' else 'work/outro/sting.wav', buf.astype(np.float32), SR)
print('ok')
