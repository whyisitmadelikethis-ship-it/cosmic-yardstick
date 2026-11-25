#!/bin/bash
# Build the final Short from a project:  tools/finish.sh <project-dir> <slug>
#   renders the story video, lays the mix under it, appends assets/outro.mp4, normalises loudness (-14 LUFS),
#   and checks the result. Output: <project>/final/<slug>.mp4  (prints one JSON line)
set -euo pipefail; cd "$(dirname "$0")/.."; P="$1"; SLUG="$2"; mkdir -p "$P/final"
node tools/render.mjs video "$P/web" "$P/final/story-silent.mp4" --fps 30 >/dev/null
VD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/final/story-silent.mp4")
ffmpeg -y -loglevel error -i "$P/final/story-silent.mp4" -i "$P/data/mix.wav" -i assets/outro.mp4 -filter_complex \
 "[0:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v0];[2:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v1];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${VD}[a0];[2:a]aresample=48000,aformat=channel_layouts=stereo[a1];\
[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][ac];[ac]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
 -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset veryfast -c:a aac -b:a 192k -movflags +faststart "$P/final/$SLUG.mp4"
python3 - "$P/final/$SLUG.mp4" "$VD" <<'PY'
import json, subprocess, sys, os
f, vd = sys.argv[1], float(sys.argv[2])
pr = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height:format=duration','-of','json',f]))
v = [s for s in pr['streams'] if s['codec_type']=='video'][0]; has_a = any(s['codec_type']=='audio' for s in pr['streams'])
dur = float(pr['format']['duration']); mb = os.path.getsize(f)/1e6
lo = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
I = [l for l in lo.splitlines() if l.strip().startswith('I:')][-1].split()[1]
ok = v['width']==1080 and v['height']==1920 and has_a and dur<=60 and mb<45
print(json.dumps({'ok':ok,'file':f,'story_s':round(vd,2),'total_s':round(dur,2),'size_mb':round(mb,1),'lufs':float(I),'audio':has_a}))
sys.exit(0 if ok else 1)
PY
