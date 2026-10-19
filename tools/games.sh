#!/bin/bash
# usage: tools/games.sh name:t1,t2 ...  -> shots/game-<name>-<t>.png (portrait 405x720)
cd "$(dirname "$0")/.."
python3 -m http.server 8123 >/dev/null 2>&1 & SRV=$!
sleep 1
for spec in "$@"; do
  n=${spec%%:*}; for t in $(echo ${spec#*:} | tr ',' ' '); do
    timeout 120 node tools/shot.mjs "game=$n&ui=0&t=$t" shots/game-$n-$t.png 405 720 2>&1 | grep -v "no console output" | head -4 | sed "s/^/$n@$t: /"
  done
done
kill $SRV
