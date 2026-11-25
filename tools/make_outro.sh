#!/bin/bash
# Rebuilds assets/outro.mp4 from engine/outro (only needed if the outro design changes).
set -e; cd "$(dirname "$0")/.."; rm -rf work/outro; mkdir -p work/outro/web
cp -r engine/kit/* work/outro/web/; cp engine/outro/* work/outro/web/
node tools/render.mjs video work/outro/web work/outro/v.mp4 --fps 30
tools/py tools/outro_audio.py
ffmpeg -y -loglevel error -i work/outro/v.mp4 -i work/outro/sting.wav -map 0:v -map 1:a -c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000" -ac 2 -c:a aac -b:a 192k -shortest -movflags +faststart assets/outro.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/outro.mp4
