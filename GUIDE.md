# The Cosmic Yardstick — production guide (read in full before making a Short)

One Short a day: a true-scale comparison, 9:16, about 30 s of story + the 1.8 s channel outro.
Everything is made in code in this repo: voice (Kokoro, free, local), pictures (canvas in headless Chrome),
music and sound effects (synthesized), so there is nothing to license and no Content ID risk.

## 1. The pipeline (commands, in order)

```
bash tools/setup.sh                                   # once per fresh workspace → "SETUP OK"
tools/new_short.sh <ID> <closest-example>             # work/<ID>/ with web/ (kit + starting scene) + script.json
# write work/<ID>/script.json  (section 3)
tools/py tools/voice.py work/<ID>                     # → data/narration.wav + web/timing.json, prints duration
# write work/<ID>/web/scene.js (section 4), then QA it (section 6):
node tools/render.mjs stills work/<ID>/web work/<ID>/sheet.jpg 0 0.5 1 1.5 2 3 4 5 ...   # look at it, fix, repeat
tools/py tools/mix.py work/<ID> <mood>                # music + effects + voice → data/mix.wav
tools/finish.sh work/<ID> <slug>                      # → work/<ID>/final/<slug>.mp4 (+ outro, −14 LUFS); prints JSON, ok must be true
node tools/render.mjs frame work/<ID>/web work/<ID>/final/<slug>-thumbnail.jpg 0 "thumb=<t>&l1=<LINE 1>&l2=<LINE 2>&teaser=<TEASER>"
python3 tools/enqueue.py --id <ID> --video ... --thumb ... --title ... --description ... --tags ... \
   --category "Education (27)" --slot-ist "<YYYY-MM-DD> 17:30" --topic ... --length <total s>
```
Examples to start from (engine/examples/): `atom-30s` is a full-length (28 s) Short already built to this guide —
hook card, zoom counter, safe zones, events — use it as the reference for structure. `atom` zoom-in through levels · `moon` stack things in a gap ·
`dna` straighten + zoom out to human size · `star` side-by-side then grow/swallow · `spin` speed readout + bars ·
`ball` "if X were a basketball" analogy + pull-back with a tape measure. They are 10 s tests made before the safe zones
existed: reuse their drawing code, but follow this guide for timing, hook, safe zones and length.

## 2. Length (hard rules)
- Story (narration + tail) **24–33 s**. Check the duration voice.py prints; if it is over 33 s, cut words (or speed ≤ 1.12) and run it again.
- Script **60–85 words**, 6–11 lines. One line = one clause the picture changes on.
- Final file = story + 1.8 s outro (finish.sh adds it). Under 45 MB.

## 3. Script: hook → build → payoff → loop
- **Hook (0–3 s, the first line, ≤ 12 words).** A question or a claim that opens a loop the viewer needs closed:
  "The Moon looks close… but it isn't." / "Shrink the Sun to a basketball. Where's Earth?" Never start with "Did you know",
  "Today", "In this video", a greeting, or the channel name. The first word is spoken by 0.25 s (lead 0.2).
- **Build (3–20 s).** 2–4 concrete steps, each one a bigger surprise than the last, each with a real number.
- **Payoff (around 65–80 % of the story).** The single most surprising number or picture, said in plain words.
- **Loop (last line).** Short, and it leads back to the first frame ("…so next time you look up, remember how far it really is.").
- Write numbers as they are said ("three hundred eighty-four thousand kilometres"), US English spelling except "metres/kilometres" is fine either way — be consistent.
- Every fact checked against a reliable source (NASA, ESA, NOAA, USGS, peer-reviewed or a well-sourced encyclopedia page). Round honestly ("about"). If sources disagree, use the cautious value and say "about" or "up to".
- Score the hook 1–5 (would a stranger scrolling stop?). Below 4 → rewrite before recording.

## 4. The picture (engine/kit/scale.js — read it)
Look: deep night `#1D2052`, flat opaque shapes, one shade step (`shadedDisc`), glow = two hard rings (`halo`),
only the palette `C`, no gradients, no crossfades (things wipe, spring, slide or cut). Sun-yellow = "look here".
- **True scale.** Whatever is compared is drawn to scale in the same frame; say so with the readout (`instrument`) or a label.
- **Frame 0 is the hook:** the most striking picture already on screen and moving, plus `hookCard(t, ['LINE 1','LINE 2?'], hookEnd)`
  (≤ 16 characters per line, the last line is yellow). No logo, no title card, no black frame.
- **Something changes every 1.5–3 s** (a zoom step, a new object, a label, a number). Key moments land on their word: `Wd('word')`.
- **Labels** `label(...)` (tag + line on a night plate), **numbers** `bigWord(...)` (spring up, on a plate), **readout** `instrument(...)`
  (start it after the hook so it doesn't fight the hook card), **subtitles** `subtitles(t, cues)` (call last in render).
- **Safe zones** (`SAFE`): keep everything important inside x 60–940, y 230–1520. YouTube's buttons cover the right edge and its
  title text covers the bottom. Subtitles are centred at y ≈ 1470 — keep objects and labels out of y 1360–1540 while a line is on screen.
- `scene(K,T)` returns `{ render, ev }`. `ev` drives the sound (tools/mix.py): `whoosh` (start of a camera move), `pop` (appears),
  `ding` (reveal/label), `lock` (number lands), `thump` (heavy arrival), `tick`, `riser` (ends at its t, put it at the payoff),
  `payoff` (music hit at the payoff word) and `hook_end` (when the hook line ends — the music opens up there). Always include
  `hook_end`, `riser` and `payoff`.

## 5. Sound (tools/mix.py)
Pick the mood that fits: `space` (planets, stars, distance), `wonder` (big friendly comparisons), `tiny` (cells, atoms, small things),
`tension` (what-if disasters, black holes), `earth` (oceans, mountains, Earth). The bed is quiet under the hook, opens up after it,
ducks under the voice, lifts at the payoff and fades by the end. finish.sh normalises the whole Short to −14 LUFS.

## 6. QA — never deliver a frame you haven't looked at
Render a contact sheet every 0.5–1 s over the whole story (`render.mjs stills`) and read every frame:
- Does it match the narration at that moment? Does the reveal land on its word? Is the true-scale claim actually drawn to scale?
- Is anything clipped, overlapping, off-palette, or inside the unsafe zones? Are labels readable on a phone?
- Is frame 0 the hook (picture + question), with no empty or black start?
- Are the numbers on screen the same as in the narration and the sources?
Fix and re-render the sheet until clean. Then after finish.sh, pull 6 frames from the final MP4
(`ffmpeg -i final.mp4 -vf "select='not(mod(n\,150))',scale=270:-1,tile=6x1" -frames:v 1 check.jpg`) and look at them, including the outro.

## 7. Packaging
- **Title** ≤ 60 characters incl. " #shorts": the question, curiosity first ("How Far Away Is the Moon, Really? #shorts").
- **Description:** 1–2 sentences that tease the payoff, a "Sources:" line with 1–3 links, then 3–5 hashtags incl. #shorts #space or #science.
- **Tags:** 6–10 (topic words, "true scale", "size comparison", "space facts" …).
- **Category:** Education (27). Not made for kids.
- **Thumbnail:** `render.mjs frame … "thumb=<t>&l1=..&l2=..&teaser=.."` at the payoff moment; 2 short lines (question; last line yellow),
  teaser 2–3 words in capitals that doesn't give the answer away ("NOT EVEN CLOSE"). Look at it; pick another t if the overlay hides the key object.
- Post slot: **17:30 IST** on the day the run starts — `--slot-ist "<IST date> 17:30"`.
