#!/usr/bin/env python3
"""find.py <serial> <regex> [ymin] [ymax] — prints "x y" of the first node whose text or content-desc
fully matches and whose center lies within [ymin, ymax] (default: below the header, above the composer)."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from ui import dump_nodes, center
serial, pat = sys.argv[1], re.compile(sys.argv[2])
ymin = int(sys.argv[3]) if len(sys.argv) > 3 else 450
ymax = int(sys.argv[4]) if len(sys.argv) > 4 else 2050
for n in dump_nodes(serial):
    if pat.fullmatch(n['text']) or pat.fullmatch(n['desc']):
        x, y = center(n)
        if ymin <= y <= ymax:
            print(x, y); sys.exit(0)
sys.exit(1)
