#!/bin/bash
# usage: tools/all.sh [asset ...]   (default: every name in tools/assets.txt) -> shots/<name>.png
cd "$(dirname "$0")/.."
python3 -m http.server 8123 >/dev/null 2>&1 & SRV=$!
sleep 1
LIST="${@:-$(cat tools/assets.txt)}"
for a in $LIST; do
  timeout 90 node tools/shot.mjs "asset=$a&ui=0&t=1&view=front" shots/$a.png 600 520 2>&1 | grep -v "no console output" | head -3 | sed "s/^/$a: /"
done
kill $SRV
