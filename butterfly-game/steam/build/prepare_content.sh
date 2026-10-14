#!/usr/bin/env bash
# Linux depot: builds desktop/dist/linux-unpacked and copies it to steam/content/linux
set -e
cd "$(dirname "$0")/../../desktop"
npm install
npx electron-builder --linux dir --x64
rm -rf ../steam/content/linux && mkdir -p ../steam/content && cp -r dist/linux-unpacked ../steam/content/linux
echo "Ready: steam/content/linux"
