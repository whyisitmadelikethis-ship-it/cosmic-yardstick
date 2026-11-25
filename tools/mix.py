"""Soundtrack for one Short: a code-made music bed in the topic's mood, ducked under the voice, plus sound effects
on the scene's events. Everything is synthesized here (no samples, no licences, no Content ID risk).

  tools/py tools/mix.py <project-dir> <mood>        mood: space | tiny | tension | wonder | earth
Reads data/narration.wav and the scene's events (node tools/events.mjs <project>/web), writes data/mix.wav (48 kHz stereo).

Scene event types (scene.js returns ev: [{t, type}]):
  whoosh  camera move / zoom (place it at the START of the move)      pop    something appears
  lock    a number lands (click + ding)                                ding   a reveal / label
  thump   a heavy arrival                                              tick   a small counter step
  riser   ends exactly at its t (use just before the payoff)          payoff the big reveal: music hit + lift
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; R = np.random.default_rng(7); BED_GAIN = 0.3   # music bed sits ~14 dB under the voice
P = Path(sys.argv[1]); MOOD = sys.argv[2] if len(sys.argv) > 2 else 'space'
HERE = Path(__file__).resolve().parent

def t_(d): return np.arange(int(round(d * SR))) / SR
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def add(buf, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or len(x) == 0: return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if x.ndim == 1:
        buf[i:i + n, 0] += x[:n] * g * (1 - max(0, pan)); buf[i:i + n, 1] += x[:n] * g * (1 + min(0, pan))
    else: buf[i:i + n] += x[:n] * g
def hz(m): return 440 * 2 ** ((m - 69) / 12)

# ---------- sound effects ----------
def whoosh(d=0.7):
    t = t_(d); n = R.standard_normal(len(t)); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    lo, hi_ = bp(n, 300, 1200), bp(n, 1500, 5000); k = np.clip(t / d, 0, 1)      # low-to-high sweep
    return (lo * (1 - k) + hi_ * k) * env * 0.6
def pop():
    t = t_(0.12); f = 900 * np.exp(-t * 18) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.6
def ding(m=88):
    t = t_(1.2); return sum(np.sin(2 * np.pi * hz(m) * r * t) * a * np.exp(-t * dcy) for r, a, dcy in [(1, 1, 3.2), (2.01, .35, 5), (3.02, .12, 8)]) * 0.35
def click():
    t = t_(0.03); return hp(R.standard_normal(len(t)), 2000) * np.exp(-t * 200) * 0.5
def thump():
    t = t_(0.6); f = 55 + 60 * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.9
def tick():
    t = t_(0.04); return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) * 0.25
def riser(d=1.4):
    t = t_(d); n = bp(R.standard_normal(len(t)), 800, 6000); s = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / d) ** 2) / SR)
    return (n * 0.35 + s * 0.15) * (t / d) ** 2.2
def hit(root):
    t = t_(2.4); boom = np.sin(2 * np.pi * np.cumsum(45 + 40 * np.exp(-t * 18)) / SR) * np.exp(-t * 2.5)
    bell = sum(ding(root + 24 + iv)[:len(t)] for iv in (0, 4, 7)) * 0.6
    return boom * 0.9 + np.pad(bell, (0, len(t) - len(bell)))

# ---------- music bed ----------
MOODS = {   # root midi, chord progression (semitone offsets per chord), tempo, layers
  'space':   dict(root=48, prog=[[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4, 6], [-5, -1, 2, 4]], bpm=84, arp=True,  pluck=False, pulse=False),
  'wonder':  dict(root=50, prog=[[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],              bpm=92, arp=True,  pluck=False, pulse=False),
  'tiny':    dict(root=55, prog=[[0, 4, 7, 9], [5, 9, 12], [-3, 0, 4, 7], [7, 11, 14]],          bpm=104, arp=False, pluck=True,  pulse=False),
  'tension': dict(root=45, prog=[[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]],              bpm=96, arp=False, pluck=False, pulse=True),
  'earth':   dict(root=52, prog=[[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],              bpm=88, arp=True,  pluck=False, pulse=True),
}
def pad_tone(m, d):
    t = t_(d); x = sum(np.sin(2 * np.pi * hz(m) * (1 + dt) * t + ph) for dt, ph in [(0, 0), (0.003, 1), (-0.003, 2)])
    x += 0.25 * sum(np.sin(2 * np.pi * hz(m) * 2 * (1 + dt) * t) for dt in (0.002, -0.002))
    a = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.4); return x * a / 4
def bell(m, d=0.9):
    t = t_(d); return (np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * 4)
def pluck(m, d=0.35):
    t = t_(d); return np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.3 * np.exp(-t * 14) + np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 9)

def music(dur, tPay, hook_end, mood):
    M = MOODS.get(mood, MOODS['space']); beat = 60 / M['bpm']; bar = beat * 4
    L = int((dur + 2.5) * SR); pad = np.zeros((L, 2)); hi = np.zeros((L, 2)); low = np.zeros((L, 2))
    nb = int(np.ceil((dur + 2.5) / bar))
    for b in range(nb):
        ch = M['prog'][b % len(M['prog'])]; t0 = b * bar
        for j, iv in enumerate(ch): add(pad, lp(pad_tone(M['root'] + iv + 12, bar + 0.4), 2200), t0, 0.16, pan=(j - 1.5) * 0.25)
        add(low, lp(pad_tone(M['root'] + ch[0] - 12, bar), 300), t0, 0.35)
        for s in range(8 if M['arp'] else 0):          # bell arpeggio in 8ths, after the hook
            if t0 + s * beat / 2 < hook_end: continue
            add(hi, bell(M['root'] + 24 + ch[s % len(ch)]), t0 + s * beat / 2, 0.07, pan=0.35 * (1 if s % 2 else -1))
        for s in range(16 if M['pluck'] else 0):
            if t0 + s * beat / 4 < hook_end: continue
            add(hi, pluck(M['root'] + 12 + ch[(s * 3) % len(ch)]), t0 + s * beat / 4, 0.06, pan=0.3 * (1 if s % 2 else -1))
        for s in range(8 if M['pulse'] else 0):
            if t0 + s * beat / 2 < hook_end * 0.5: continue
            add(low, pluck(M['root'] - 12 + ch[0], 0.25), t0 + s * beat / 2, 0.22)
    # shape: quiet under the hook, full after it, a lift at the payoff, fade at the very end
    tt = np.arange(L) / SR
    env = 0.55 + 0.45 * np.clip((tt - hook_end + 0.6) / 1.2, 0, 1)
    env *= 1 + 0.35 * np.clip((tt - tPay) / 0.3, 0, 1) * np.clip((dur - tt) / 1.5, 0, 1)
    env *= np.clip((dur + 1.6 - tt) / 1.6, 0, 1)
    return (pad + hi + low) * env[:, None], M['root']

# ---------- assemble ----------
v, vsr = sf.read(P / 'data' / 'narration.wav', always_2d=False)
if v.ndim > 1: v = v.mean(1)
assert vsr == SR, 'narration must be 48 kHz (voice.py writes it so)'
E = json.loads(subprocess.check_output(['node', str(HERE / 'events.mjs'), str(P / 'web')]))
dur = max(len(v) / SR, E['dur']); ev = E['ev']
tPay = next((e['t'] for e in ev if e['type'] == 'payoff'), dur * 0.7)
hook_end = next((e['t'] for e in ev if e['type'] == 'hook_end'), 3.5)
bed, root = music(dur, tPay, hook_end, MOOD)
buf = np.zeros((int((dur + 0.3) * SR), 2)); n = min(len(buf), len(bed)); buf[:n] += bed[:n] * BED_GAIN

# duck the music under the voice (fast attack, slow release)
env = np.abs(v); win = int(0.03 * SR); env = np.convolve(env, np.ones(win) / win, 'same'); env = env / max(1e-6, env.max())
duck = np.ones(len(buf)); d = np.clip(env * 3, 0, 1); rel = np.zeros_like(d); a = 0
for i in range(0, len(d), 240):                              # 5 ms steps
    target = d[i]; a = target if target > a else a * 0.985 ** 1 + target * 0.015; rel[i:i + 240] = a
duck[:len(rel)] = 1 - 0.5 * rel
buf *= duck[:, None]

S = {'whoosh': (whoosh, 0.55), 'pop': (pop, 0.35), 'ding': (lambda: ding(88), 0.35), 'thump': (thump, 0.55), 'tick': (tick, 0.3)}
for i, e in enumerate(ev):
    ty, t = e['type'], e['t']; pan = ((i % 3) - 1) * 0.2
    if ty in S: f, g = S[ty]; add(buf, f(), t - (0.15 if ty == 'whoosh' else 0), g, pan)
    elif ty == 'lock': add(buf, click(), t, 0.4); add(buf, ding(91), t + 0.03, 0.35)
    elif ty == 'riser': r = riser(1.4); add(buf, r, t - 1.4, 0.4)
    elif ty == 'payoff': add(buf, hit(root), t, 0.55)
add(buf, v * 0.92, 0, 1.0)
pk = np.abs(buf).max(); buf = buf / pk * 0.9 if pk > 0.9 else buf
sf.write(P / 'data' / 'mix.wav', buf.astype(np.float32), SR)
print(json.dumps({'mix': str(P / 'data' / 'mix.wav'), 'dur': round(len(buf) / SR, 2), 'mood': MOOD, 'payoff_at': round(tPay, 2), 'events': len(ev)}))
