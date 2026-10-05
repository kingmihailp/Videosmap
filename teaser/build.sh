#!/usr/bin/env bash
# Rebuild the Flora0world: HUB teaser from source (needs: python3, pillow, numpy, ffmpeg).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
python3 audio.py out/audio.wav
python3 video.py render out/video_silent.mp4
ffmpeg -y -loglevel error -i out/video_silent.mp4 -i out/audio.wav \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest \
  Flora0world_HUB_teaser.mp4
echo "done: teaser/Flora0world_HUB_teaser.mp4"
