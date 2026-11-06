#!/usr/bin/env python3
"""analyze.py <session-dir> — turns a bench session's logcat + gfxinfo dumps into per-window metrics.

Input:  <dir>/logcat.txt   (adb logcat -v epoch, tags ReactNativeJS + PERFMARK)
        <dir>/gfx/<label>.txt  (dumpsys gfxinfo after each window, reset at its start)
Output: <dir>/windows.json  — one record per window (label = "<scenario>#<run>")

Per window:
  commits, render_ms (sum HostRoot actualDuration), wall_ms (sum render+commit+layout effects),
  layout_fx_ms, passive_fx_ms, js_react_ms (= wall + passive), max_commit_wall_ms,
  dispatch_ms / dispatch_n (LLC dispatchEvent), dispatch_by_type,
  cpu_js_ms / cpu_main_ms / cpu_rt_ms / cpu_proc_ms (thread CPU time, 10ms ticks),
  gc_n / gc_cpu_ms (Hermes, sampled once a second), frames (gfxinfo),
  comps: {name: [incl_ms, self_ms, renders, mounts]}, counts (Bench channel loaded-message counts)
"""
import json
import os
import re
import sys
from collections import defaultdict

LINE = re.compile(r'^\s*(\d+\.\d+)\s+(\d+)\s+\d+\s+\w\s+(\S+)\s*:\s?(.*)$')


def parse(path):
    names = {}
    commits = {}  # cid -> dict
    order = []
    layout, passive, events, heap, counts, marks, speed = [], [], [], [], [], [], []
    for raw in open(path, errors='replace'):
        m = LINE.match(raw)
        if not m:
            continue
        pid, tag, msg = m.group(2), m.group(3), m.group(4)
        if tag == 'PERFMARK':
            parts = msg.split()
            if len(parts) < 3:
                continue
            kind, label, ts = parts[0], parts[1], int(parts[2])
            threads = {}
            for p in parts[3:]:
                n, tid, ticks = p.split(':')
                threads.setdefault(n, {})[tid] = int(ticks)
            marks.append((kind, label, ts, threads))
            continue
        if tag != 'ReactNativeJS' or not msg.startswith('BENCH '):
            continue
        _, kind, payload = msg.split(' ', 2)
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if kind == 'N':
            # every app process numbers component names from 0
            for i, n in data:
                names[(pid, i)] = n
        elif kind == 'C':
            cid, ts, wall, render, walk = data
            cid = (pid, cid)  # commit ids restart in every app process
            commits[cid] = {'ts': ts, 'wall': wall, 'render': render, 'rows': [], 'pid': pid}
            order.append(cid)
        elif kind == 'D':
            cid, rows = (pid, data[0]), data[1]
            if cid in commits:
                commits[cid]['rows'].extend(rows)
        elif kind == 'L':
            layout.append(data)
        elif kind == 'P':
            passive.append(data)
        elif kind == 'E':
            events.append(data)
        elif kind == 'H':
            heap.append(data)
        elif kind == 'M':
            counts.append(data)
        elif kind == 'S':
            speed.append(data)
    return names, [commits[c] for c in order], layout, passive, events, heap, counts, marks, speed


def gfx(path):
    if not os.path.exists(path):
        return None
    t = open(path, errors='replace').read()
    def num(pat):
        m = re.search(pat, t)
        return float(m.group(1)) if m else None
    return {
        'frames': num(r'Total frames rendered: (\d+)'),
        'janky': num(r'Janky frames: (\d+)'),
        'p50': num(r'50th percentile: (\d+)ms'),
        'p90': num(r'90th percentile: (\d+)ms'),
        'p95': num(r'95th percentile: (\d+)ms'),
        'p99': num(r'99th percentile: (\d+)ms'),
        'slow_ui': num(r'Number Slow UI thread: (\d+)'),
        'missed_vsync': num(r'Number Missed Vsync: (\d+)'),
    }


def cpu_ms(start, end, name):
    a, b = start.get(name, {}), end.get(name, {})
    if name == 'mqt_v_js':
        # several JS-named threads; the runtime one is the busiest
        return max(((b[t] - a.get(t, 0)) * 10 for t in b), default=None)
    return sum((b[t] - a.get(t, 0)) * 10 for t in b) if b else None


def main(d):
    names, commits, layout, passive, events, heap, counts, marks, speed = parse(os.path.join(d, 'logcat.txt'))
    open_marks = {}
    windows = []
    for kind, label, ts, threads in marks:
        if kind == 'S':
            open_marks[label] = (ts, threads)
        elif kind == 'E' and label in open_marks:
            t0, th0 = open_marks.pop(label)
            windows.append((label, t0, ts, th0, threads))
    out = []
    for label, t0, t1, th0, th1 in windows:
        inside = lambda ts: t0 <= ts <= t1
        cs = [c for c in commits if inside(c['ts'])]
        comps = defaultdict(lambda: [0.0, 0.0, 0, 0])
        for c in cs:
            for row in c['rows']:
                i, self_ms, incl, rend, mnt = row[:5]
                e = comps[names.get((c['pid'], i), f'?{i}')]
                e[0] += incl
                e[1] += self_ms
                e[2] += rend
                e[3] += mnt
        ev = [e for e in events if inside(e[0])]
        by_type = defaultdict(lambda: [0, 0.0])
        for _, typ, dt in ev:
            by_type[typ][0] += 1
            by_type[typ][1] += dt
        h0 = max((h for h in heap if h[0] <= t0), key=lambda h: h[0], default=None)
        h1 = min((h for h in heap if h[0] >= t1), key=lambda h: h[0], default=None)
        rec = {
            'label': label,
            'scenario': label.split('#')[0],
            'run': label.split('#')[1] if '#' in label else '0',
            'dur_ms': t1 - t0,
            'commits': len(cs),
            'render_ms': sum(c['render'] for c in cs),
            'wall_ms': sum(max(c['wall'], 0) for c in cs),
            'max_commit_wall_ms': max((c['wall'] for c in cs), default=0),
            'layout_fx_ms': sum(x[1] for x in layout if inside(x[0])),
            'passive_fx_ms': sum(x[1] for x in passive if inside(x[0])),
            'dispatch_ms': sum(e[2] for e in ev),
            'dispatch_n': len(ev),
            'dispatch_by_type': {k: [v[0], round(v[1], 2)] for k, v in by_type.items()},
            'cpu_js_ms': cpu_ms(th0, th1, 'mqt_v_js'),
            'cpu_main_ms': cpu_ms(th0, th1, 'main'),
            'cpu_rt_ms': cpu_ms(th0, th1, 'RenderThread'),
            'cpu_proc_ms': cpu_ms(th0, th1, 'proc'),
            # a new process (cold start) restarts the counters
            'gc_n': (h1[1] - (h0[1] if h1[1] >= h0[1] else 0)) if h0 and h1 else None,
            'gc_cpu_ms': round(h1[2] - (h0[2] if h1[1] >= h0[1] else 0), 2) if h0 and h1 else None,
            'frames': gfx(os.path.join(d, 'gfx', label.replace('/', '_') + '.txt')),
            'counts': [c for c in counts if c[0] <= t1],
            'comps': {k: [round(v[0], 2), round(v[1], 2), v[2], v[3]] for k, v in comps.items()},
        }
        rec['js_react_ms'] = rec['wall_ms'] + rec['passive_fx_ms']
        sp = sorted(x[1] for x in speed if t0 - 1000 <= x[0] <= t1 + 1000)
        rec['speed_ms'] = sp[len(sp) // 2] if sp else None
        mp = sorted(x[3] for x in speed if len(x) > 3 and t0 - 1000 <= x[0] <= t1 + 1000)
        rec['mem_speed_ms'] = mp[len(mp) // 2] if mp else None
        rec['counts'] = {name: n for _, name, n in rec['counts']}
        out.append(rec)
    json.dump(out, open(os.path.join(d, 'windows.json'), 'w'), indent=1)
    for r in out:
        print(f"{r['label']:<28} commits={r['commits']:>4} render={r['render_ms']:8.1f} wall={r['wall_ms']:8.1f} "
              f"passive={r['passive_fx_ms']:7.1f} disp={r['dispatch_ms']:6.1f}/{r['dispatch_n']} "
              f"cpuJS={r['cpu_js_ms']} cpuUI={r['cpu_main_ms']} cpuRT={r['cpu_rt_ms']} gc={r['gc_n']}")


if __name__ == '__main__':
    main(sys.argv[1])
