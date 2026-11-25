"""Narration with the free local Kokoro voice, plus line and word timings for the scene.

  tools/py tools/voice.py <project-dir>

Reads  <project>/script.json:
  { "voice": "am_michael", "speed": 1.05, "lead": 0.25, "gap": 0.22, "tail": 0.5,
    "lines": [ {"text": "The Moon looks close..."}, {"text": "but it isn't.", "gap": 0.35}, ... ] }
Each line is spoken in one pass (write each line as a full clause; numbers as they are said).
Writes <project>/data/narration.wav (48 kHz mono) and <project>/web/timing.json:
  { "dur": s, "lines": [{"t0","t1","text"}], "words": [{"w","t"}] }   (word times are estimated inside each line)
Prints the total duration.
"""
import json, os, re, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro

P = Path(sys.argv[1]); S = json.loads((P / 'script.json').read_text())
K = Path.home() / '.cy' / 'kokoro'
k = Kokoro(str(K / 'kokoro-v1.0.onnx'), str(K / 'voices-v1.0.bin'))
voice = S.get('voice', 'am_michael'); speed = float(S.get('speed', 1.05))
lang = 'en-gb' if voice.startswith('b') else 'en-us'
SR_IN, SR = 24000, 48000


def trim(x, thr=0.008):
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x
    a = max(0, idx[0] - int(0.01 * SR_IN)); b = min(len(x), idx[-1] + int(0.04 * SR_IN)); return x[a:b]


def weight(w):  # rough spoken length of a word
    core = re.sub(r"[^A-Za-z0-9]", "", w)
    v = max(1, len(re.findall(r"[aeiouy]+", core.lower()))) + len(core) * 0.12
    if re.search(r"\d", core): v += len(core) * 0.6
    return v


audio = [np.zeros(int(float(S.get('lead', 0.25)) * SR_IN))]; t = len(audio[0]) / SR_IN
lines, words = [], []
for i, ln in enumerate(S['lines']):
    x = trim(np.asarray(k.create(ln['text'], voice=voice, speed=speed, lang=lang)[0], dtype=np.float64))
    d = len(x) / SR_IN; t0 = t
    lines.append({'t0': round(t0, 3), 't1': round(t0 + d, 3), 'text': ln['text']})
    ws = ln['text'].split(); wt = [weight(w) for w in ws]; tot = sum(wt); acc = 0.0
    for w, ww in zip(ws, wt):
        words.append({'w': w, 't': round(t0 + 0.02 + (d - 0.1) * acc / tot, 3)}); acc += ww
        if re.search(r"[,;:]$", w): acc += 0.6
    audio.append(x); t += d
    gap = float(ln.get('gap', S.get('gap', 0.22))) if i < len(S['lines']) - 1 else float(S.get('tail', 0.5))
    audio.append(np.zeros(int(gap * SR_IN))); t += gap
y = np.concatenate(audio); y = resample_poly(y, 2, 1); y = y / max(1e-6, np.abs(y).max()) * 0.89
(P / 'data').mkdir(exist_ok=True); (P / 'web').mkdir(exist_ok=True)
sf.write(P / 'data' / 'narration.wav', y.astype(np.float32), SR)
dur = round(len(y) / SR, 3)
(P / 'web' / 'timing.json').write_text(json.dumps({'dur': dur, 'lines': lines, 'words': words}, ensure_ascii=False, indent=1))
print(json.dumps({'duration': dur, 'lines': len(lines), 'words': len(words)}))
