#!/bin/bash
# One-time setup for a fresh workspace. Safe to re-run. Prints "SETUP OK" when everything works.
# Needs: node 22+, ffmpeg, Google Chrome (present in the cloud workspace). Installs: playwright-core (npm),
# a Python env at ~/.cy/venv (numpy, scipy, soundfile, kokoro-onnx) and the Kokoro voice (~340 MB, from GitHub).
set -u; cd "$(dirname "$0")/.."; ok=1; say(){ printf '%-10s %s\n' "$1" "$2"; }
node -e 'process.exit(+process.versions.node.split(".")[0]>=20?0:1)' 2>/dev/null && say node ok || { say node MISSING; ok=0; }
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null && say ffmpeg ok || { say ffmpeg MISSING; ok=0; }
CH="${CHROME:-/usr/bin/google-chrome}"; [ -x "$CH" ] && say chrome ok || { say chrome "MISSING ($CH)"; ok=0; }
[ -d node_modules/playwright-core ] || npm install --silent >/dev/null 2>&1; [ -d node_modules/playwright-core ] && say npm ok || { say npm "playwright-core install FAILED"; ok=0; }
V=~/.cy/venv; [ -x $V/bin/python ] || python3 -m venv $V
$V/bin/python -c "import numpy,scipy,soundfile,kokoro_onnx" 2>/dev/null || $V/bin/pip install -q numpy scipy soundfile kokoro-onnx >/dev/null 2>&1
$V/bin/python -c "import numpy,scipy,soundfile,kokoro_onnx" 2>/dev/null && say python ok || { say python "env BROKEN"; ok=0; }
K=~/.cy/kokoro; mkdir -p $K
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s $K/$f ] && [ $(stat -c%s $K/$f) -gt 1000000 ] && continue
  if [ -s ~/.faceless-shorts/kokoro/$f ]; then cp ~/.faceless-shorts/kokoro/$f $K/$f; continue; fi
  curl -sfL -o $K/$f.part "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f" && mv $K/$f.part $K/$f
done
[ -s $K/kokoro-v1.0.onnx ] && [ -s $K/voices-v1.0.bin ] && say voice ok || { say voice "model download FAILED"; ok=0; }
[ $ok = 1 ] && echo "SETUP OK" || { echo "SETUP FAILED"; exit 1; }
