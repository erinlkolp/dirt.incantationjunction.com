#!/usr/bin/env python3
"""Generate the isometric voxel block art in public/img/.

Original pixel art drawn in the voxel-block style. No third-party game
textures are used or copied; palettes and noise are defined below. Rerun
from the repo root after editing:

    python3 tools/generate-blocks.py
"""
import random

S, H, N = 64, 64, 8          # half-width, side height, grid cells per face edge

def shade(hexcol, f):
    hexcol = hexcol.lstrip('#')
    r, g, b = (int(hexcol[i:i+2], 16) for i in (0, 2, 4))
    r, g, b = (max(0, min(255, int(c * f))) for c in (r, g, b))
    return f'#{r:02x}{g:02x}{b:02x}'

def poly(pts, fill):
    d = ' '.join(f'{x:g},{y:g}' for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}" stroke="{fill}" stroke-width=".5"/>'

def top_pt(i, j):
    return (S/N*i - S/N*j, -S + (S/2)/N*i + (S/2)/N*j)

def left_pt(i, j):
    return (-S + S/N*i, -S/2 + (S/2)/N*i + H/N*j)

def right_pt(i, j):
    return (S/N*i, -(S/2)/N*i + H/N*j)

def face(ptfn, palette, rng, bright, rows=None, top_palette=None, top_rows=0):
    out = []
    for j in range(N):
        for i in range(N):
            pal = top_palette if (top_palette and j < top_rows) else palette
            col = shade(rng.choice(pal), bright)
            out.append(poly([ptfn(i, j), ptfn(i+1, j), ptfn(i+1, j+1), ptfn(i, j+1)], col))
    return ''.join(out)

DIRT   = ['#6b4a2f', '#7a563a', '#5d3f28', '#85623f', '#513720', '#73512f']
GRASS  = ['#5f9a3d', '#6fae48', '#4f8632', '#7cbc52', '#569036']
COARSE = ['#5a3f28', '#6b4a2f', '#48311d', '#7a563a', '#3e2a19']
COMPOST= ['#3d2b1c', '#4a3423', '#332316', '#574029']
SAND   = ['#b9a06a', '#c8b07c', '#a88f5c', '#d0bb8b']

def block(seed, top_pal, side_pal, fringe=0, fringe_pal=None, strata=None):
    rng = random.Random(seed)
    parts = [face(top_pt, top_pal, rng, 1.0)]
    for ptfn, bright in ((left_pt, 0.72), (right_pt, 0.88)):
        if strata:
            out = []
            for j in range(N):
                pal = strata[min(j * len(strata) // N, len(strata)-1)]
                for i in range(N):
                    out.append(poly([ptfn(i, j), ptfn(i+1, j), ptfn(i+1, j+1), ptfn(i, j+1)],
                                    shade(rng.choice(pal), bright)))
            parts.append(''.join(out))
        else:
            parts.append(face(ptfn, side_pal, rng, bright,
                              top_palette=fringe_pal, top_rows=fringe))
    return ''.join(parts)

WRAP = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-68 -68 136 136" role="img">'
        '%s</svg>')

def svg(inner):
    return WRAP % inner

def placed(inner, tx, ty, k):
    return f'<g transform="translate({tx} {ty}) scale({k})">{inner}</g>'

_grass  = block(11, GRASS,  DIRT,   fringe=2, fringe_pal=GRASS)
_dirt   = block(22, DIRT,   DIRT)
_coarse = block(33, COARSE, COARSE)
_strata = block(44, GRASS,  DIRT,   strata=[GRASS, COMPOST, DIRT, SAND])
_sand   = block(55, SAND,   SAND)

# 4-block pile on valid isometric lattice positions.
# At scale k the legal neighbour moves are (+-S*k, +-S/2*k) = (+-32, +-16).
# Two back blocks, one front block, one resting on the front block.
# Painter's order: back-left, back-right, front, then the one on top.
_stack = (placed(_coarse, -32,   0, 0.5) +
          placed(_dirt,    32,   0, 0.5) +
          placed(_coarse,   0,  16, 0.5) +
          placed(_grass,    0, -16, 0.5))

blocks = {
  'grass-block.svg':  svg(_grass),
  'dirt-block.svg':   svg(_dirt),
  'coarse-block.svg': svg(_coarse),
  'strata-block.svg': svg(_strata),
  'sand-block.svg':   svg(_sand),
  'stack-block.svg':  svg(_stack),
}
for name, doc in blocks.items():
    open('public/img/' + name, 'w').write(doc)
    print(f'{name:20} {len(doc):>6} bytes')
