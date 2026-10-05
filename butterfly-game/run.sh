#!/usr/bin/env bash
# Opens the game in your default browser (Linux / macOS)
DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v xdg-open >/dev/null; then xdg-open "$DIR/Flora0world_Butterflies.html"; else open "$DIR/Flora0world_Butterflies.html"; fi
