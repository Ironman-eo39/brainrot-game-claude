#!/bin/bash
# render every scene portrait to shots/scene-<name>.png and montage -> shots/scenes-montage.png
cd "$(dirname "$0")/.."
python3 -m http.server 8123 >/dev/null 2>&1 & SRV=$!
sleep 1
for s in $(grep -oP "^  '\K[a-z-]+(?=': \{ label)" src/scenes/scenes.js); do
  timeout 120 node tools/shot.mjs "scene=$s&ui=0&t=1" shots/scene-$s.png 405 720 2>&1 | grep -v "no console output" | head -4 | sed "s/^/$s: /"
done
kill $SRV
python3 - <<'PY'
from PIL import Image, ImageDraw
import glob,os
fs=sorted(glob.glob('shots/scene-*.png'))
cell=(324,576); cols=5; rows=(len(fs)+cols-1)//cols
M=Image.new('RGB',(cell[0]*cols,cell[1]*rows),(20,20,20)); d=ImageDraw.Draw(M)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize(cell); x,y=(i%cols)*cell[0],(i//cols)*cell[1]; M.paste(im,(x,y)); d.text((x+6,y+4),os.path.basename(f)[6:-4],fill=(255,255,0))
M.save('shots/scenes-montage.png'); print(M.size,len(fs))
PY
