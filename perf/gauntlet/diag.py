#!/usr/bin/env python3
"""diag.py <mode> ... — reads logcat.txt of sessions run with DIAGNOSTIC builds (build.sh <label> <root> diag).
Never quote timings from diag builds; these modes are deterministic counts.

  hooks <base-session-dir> <head-session-dir>   hooks per mount per component, base vs head, sorted by delta,
                                                plus hooks per mounted message row (biggest row-mount commit)
  ctx <session-dir> <window-label>              context providers whose value changed identity in the window,
                                                with the keys that changed (who invalidates the tree?)
  areequal <session-dir> <window-label>         which Message areEqual check failed, per window; an EMPTY
                                                result while rows re-render means they re-render from a
                                                context/store they read themselves, not from props
"""
import json
import os
import re
import sys

LINE = re.compile(r'\s(\d+)\s+\d+\s+\w\s+ReactNativeJS: BENCH (\w) (\[.*\])$')
MARK = re.compile(r'PERFMARK: ([SE]) (\S+) (\d+)')


def read(d):
    names, rows, extra, marks = {}, [], [], {}
    for line in open(os.path.join(d, 'logcat.txt'), errors='replace'):
        m = MARK.search(line)
        if m:
            marks.setdefault(m.group(2), {})[m.group(1)] = int(m.group(3))
            continue
        m = LINE.search(line)
        if not m:
            continue
        pid, kind, data = m.group(1), m.group(2), json.loads(m.group(3))
        if kind == 'N':
            for i, n in data:
                names[(pid, i)] = n
        elif kind == 'D':
            rows.append((pid, data[1]))
        elif kind in ('X', 'A'):
            extra.append((kind, data[0], data[1]))
    return names, rows, extra, marks


def hooks(d):
    names, rows, _, _ = read(d)
    hk, mt = {}, {}
    best = None
    for pid, r in rows:
        msg = sum(x[4] for x in r if names.get((pid, x[0])) == 'Message')
        if msg and (best is None or msg > best[0]):
            best = (msg, pid, r)
        for x in r:
            if len(x) > 5 and x[4]:
                n = names.get((pid, x[0]), '?')
                hk[n] = hk.get(n, 0) + x[5]
                mt[n] = mt.get(n, 0) + x[4]
    per_row = None
    if best:
        msg, pid, r = best
        skip = ('Channel', 'Chat', 'MessageList', 'MessageComposer', 'MessageInput', 'Thread')
        total = sum(x[5] for x in r if len(x) > 5 and not names.get((pid, x[0]), '').startswith(skip))
        per_row = (total / msg, msg)
    return {n: hk[n] / mt[n] for n in hk if mt[n]}, per_row


def in_window(extra, kind, marks, label):
    t = marks[label]
    agg = {}
    for k, ts, d in extra:
        if k == kind and t['S'] - 200 <= ts <= t['E'] + 1200:  # flushed once a second
            for key, v in d.items():
                agg[key] = agg.get(key, 0) + v
    return sorted(agg.items(), key=lambda kv: -kv[1])


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'hooks':
        (ha, ra), (hb, rb) = hooks(sys.argv[2]), hooks(sys.argv[3])
        if not ha or not hb:
            sys.exit('no hook data: was this a diag build? (rows carry a 6th field only with GAUNTLET_DIAG)')
        print(f'hooks per mounted message row: base {ra[0]:.1f} (n={ra[1]}), head {rb[0]:.1f} (n={rb[1]})')
        diff = sorted(set(ha) | set(hb), key=lambda n: -abs(hb.get(n, 0) - ha.get(n, 0)))
        print(f'{"component (hooks per mount)":<55} {"base":>6} {"head":>6} {"delta":>6}')
        for n in diff[:40]:
            if ha.get(n, 0) != hb.get(n, 0):
                print(f'{n[:55]:<55} {ha.get(n, 0):6.1f} {hb.get(n, 0):6.1f} {hb.get(n, 0) - ha.get(n, 0):+6.1f}')
    else:
        _, _, extra, marks = read(sys.argv[2])
        for k, v in in_window(extra, {'ctx': 'X', 'areequal': 'A'}[mode], marks, sys.argv[3]):
            print(v, k)
