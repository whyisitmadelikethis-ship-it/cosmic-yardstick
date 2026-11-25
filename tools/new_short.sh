#!/bin/bash
# tools/new_short.sh <ID> [example]  -> work/<ID>/ with web/ (kit + a starting scene.js) and a script.json template
set -e; cd "$(dirname "$0")/.."; ID="$1"; EX="${2:-}"; P="work/$ID"; mkdir -p "$P/web" "$P/data" "$P/final"
cp -r engine/kit/* "$P/web/"
if [ -n "$EX" ]; then cp "engine/examples/$EX/scene.js" "$P/web/scene.js"; else cp engine/examples/moon/scene.js "$P/web/scene.js"; fi
[ -f "$P/script.json" ] || cat > "$P/script.json" <<'J'
{ "voice": "am_michael", "speed": 1.05, "lead": 0.2, "gap": 0.22, "tail": 0.6,
  "lines": [ {"text": "HOOK LINE"}, {"text": "..."} ] }
J
echo "$P"
