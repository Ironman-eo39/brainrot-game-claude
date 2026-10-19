"""Cut characters out of reference photos -> assets/cutouts/<name>.png (RGBA, cropped square-padded).
usage: python3 tools/cutout.py <src.png> <name>"""
import sys
from PIL import Image
from rembg import remove, new_session
src, name = sys.argv[1], sys.argv[2]; model = sys.argv[3] if len(sys.argv) > 3 else 'u2net'
im = Image.open(src).convert('RGB')
out = remove(im, session=new_session(model), alpha_matting=False)
bbox = out.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
out = out.crop(bbox)
out.save(f'assets/cutouts/{name}.png'); print(name, out.size)
