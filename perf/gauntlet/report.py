#!/usr/bin/env python3
"""report.py <mode> <dir>... — base vs head tables from analyzed sessions (run analyze.py on each first;
session.sh does it at the end). A <dir> is a session dir (has meta.txt) or a run dir (out/<name>) whose
session subdirs are all used.

Modes:
  main    per-scenario JS work (render + commit + effects), medians with min-max, Mann-Whitney p, verdict,
          plus render, commits, JS/UI-thread CPU and the speed index (runtime speed during the windows)
  lists   FlatList vs FlashList per side, for every scenario run with both
  comps   major-component tables (inclusive ms, renders r / mounts m) for mount and re-render scenarios
  ci      SESSION-level bootstrap 95% CIs for chosen scenarios (default: open_channel_flat x_open_flat
          scroll_flat x_scroll_flat), on raw render, render / speed index and JS-thread CPU. Use this before
          calling a few-% difference real: per-run p-values overstate certainty (runs within a session share
          the emulator's state)
  diff <scenario>   per-component median self time / renders / mounts base vs head, sorted by delta

Verdicts in `main`: "faster"/"SLOWER" only when p < 0.05 AND |delta| >= 5% AND >= 1 ms; otherwise "same".
FlatList event windows where the list mounted a new batch of cells (> 5 Message mounts) are split out as
"<scenario>~batch": that is VirtualizedList windowing landing in the window, not the event's own cost.
"""
import glob
import json
import math
import os
import random
import statistics
import sys
from collections import defaultdict

EVENT_PREFIXES = ('ch_', 'composer_', 'thread_reply_event', 'list_')
SIDES = ('base', 'head')
# For runs with more than two sides (run3.sh), GAUNTLET_COMPARE=<side>:<side> picks the pair to report: the
# first is shown as "base", the second as "head", and sessions of any other side are skipped.
COMPARE = os.environ.get('GAUNTLET_COMPARE')


def sessions(args):
    out = []
    for a in args:
        if os.path.exists(os.path.join(a, 'meta.txt')):
            out.append(a)
        else:
            out += sorted(d for d in glob.glob(os.path.join(a, '*')) if os.path.exists(os.path.join(d, 'windows.json')))
    return out


def meta(d):
    m = {}
    for tok in open(os.path.join(d, 'meta.txt')).read().split():
        if '=' in tok:
            k, v = tok.split('=', 1)
            m[k] = v
    return m


def is_batch(w):
    return w['comps'].get('Message', [0, 0, 0, 0])[3] > 5


def load(dirs, keep_batches=False):
    runs = {s: defaultdict(list) for s in SIDES}
    per_session = {s: [] for s in SIDES}
    for d in dirs:
        side = meta(d)['side']
        if COMPARE:
            pair = COMPARE.split(':')
            if side not in pair:
                continue
            side = SIDES[pair.index(side)]
        ws = json.load(open(os.path.join(d, 'windows.json')))
        per_session[side].append(ws)
        for w in ws:
            if not keep_batches and w['scenario'].startswith(EVENT_PREFIXES) and is_batch(w):
                runs[side][w['scenario'] + '~batch'].append(w)
            else:
                runs[side][w['scenario']].append(w)
    return runs, per_session


def mannwhitney(a, b):
    if len(a) < 3 or len(b) < 3:
        return None
    allv = sorted([(v, 0) for v in a] + [(v, 1) for v in b])
    ranks = [0.0] * len(allv)
    i = 0
    ties = 0.0
    while i < len(allv):
        j = i
        while j + 1 < len(allv) and allv[j + 1][0] == allv[i][0]:
            j += 1
        for k in range(i, j + 1):
            ranks[k] = (i + j) / 2 + 1
        t = j - i + 1
        ties += t ** 3 - t
        i = j + 1
    n1, n2 = len(a), len(b)
    u1 = sum(r for r, (_, g) in zip(ranks, allv) if g == 0) - n1 * (n1 + 1) / 2
    n = n1 + n2
    sigma = math.sqrt(n1 * n2 / 12 * ((n + 1) - ties / (n * (n - 1))))
    if sigma == 0:
        return 1.0
    z = (abs(u1 - n1 * n2 / 2) - 0.5) / sigma
    return max(0.0, min(1.0, math.erfc(z / math.sqrt(2))))


def med(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def fmt(x, nd=1):
    return '-' if x is None else f'{x:.{nd}f}'


def cell(xs, m):
    return '-' if m is None else f'{m:.1f} ({min(xs):.0f}-{max(xs):.0f})'


def verdict(a, b, p):
    if a is None or b is None:
        return ''
    d = b - a
    rel = d / a * 100 if a else (0 if d == 0 else math.inf)
    if p is None or p >= 0.05 or abs(d) < 1 or abs(rel) < 5:
        return 'same'
    return 'faster' if d < 0 else 'SLOWER'


def vals(runs, side, scen, key):
    return [w.get(key) for w in runs[side].get(scen, []) if w.get(key) is not None]


def mode_main(dirs):
    runs, _ = load(dirs)
    print('| scenario | n base/head | JS work base ms | JS work head ms | delta | p | verdict | render base/head | commits | JS CPU base/head | UI CPU base/head | speed idx base/head (arith, mem) |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|')
    for s in sorted(set(runs['base']) | set(runs['head'])):
        a, b = vals(runs, 'base', s, 'js_react_ms'), vals(runs, 'head', s, 'js_react_ms')
        ma, mb = med(a), med(b)
        p = mannwhitney(a, b)
        d = (mb - ma) if ma is not None and mb is not None else None
        rel = f' ({d / ma * 100:+.0f}%)' if d is not None and ma else ''
        g = lambda k: f"{fmt(med(vals(runs, 'base', s, k)), 0)}/{fmt(med(vals(runs, 'head', s, k)), 0)}"
        sp = (f"{fmt(med(vals(runs, 'base', s, 'speed_ms')), 2)}/{fmt(med(vals(runs, 'head', s, 'speed_ms')), 2)} "
              f"mem {fmt(med(vals(runs, 'base', s, 'mem_speed_ms')), 2)}/{fmt(med(vals(runs, 'head', s, 'mem_speed_ms')), 2)}")
        print(f'| {s} | {len(a)}/{len(b)} | {cell(a, ma)} | {cell(b, mb)} | {fmt(d)}{rel} | {fmt(p, 3)} | {verdict(ma, mb, p)} | '
              f"{g('render_ms')} | {g('commits')} | {g('cpu_js_ms')} | {g('cpu_main_ms')} | {sp} |")


def mode_lists(dirs):
    runs, _ = load(dirs)
    print('| scenario | side | FlatList ms | FlashList ms | FlashList vs FlatList | p |')
    print('|---|---|---|---|---|---|')
    bases = sorted({s[:-5] for side in SIDES for s in runs[side] if s.endswith('_flat')})
    for base in bases:
        for side in SIDES:
            a, b = vals(runs, side, base + '_flat', 'js_react_ms'), vals(runs, side, base + '_flash', 'js_react_ms')
            if not a or not b:
                continue
            ma, mb = med(a), med(b)
            rel = (mb - ma) / ma * 100 if ma else 0
            print(f'| {base} | {side} | {cell(a, ma)} | {cell(b, mb)} | {mb - ma:+.1f} ({rel:+.0f}%) | {fmt(mannwhitney(a, b), 3)} |')


MAJOR = [
    ('#root', 'Whole app (all React work)'), ('ChannelList', 'ChannelList'), ('ChannelPreview', 'ChannelPreview (rows)'),
    ('ChannelHeader', 'ChannelHeader (SampleApp)'), ('Channel', 'Channel'), ('MessageList', 'MessageList (FlatList)'),
    ('MessageFlashList', 'MessageFlashList'), ('Message', 'Message (rows)'),
    ('MessageTextContainerWithContext', '  text + markdown'), ('ReactionListTop', '  reaction list'),
    ('GalleryWithContext', '  image gallery'), ('MessageFooterWithContext', '  footer'),
    ('MessageComposer{messageComposer}', 'MessageComposer'), ('AutoCompleteInputWithContext', '  input'),
    ('Thread', 'Thread'), ('MessageOverlayHostLayer', 'Message overlay host'),
]
COMP_GROUPS = [
    (['cold_start', 'open_channel_flat', 'open_channel_flash'], 'Mount: cold start (channel list) and opening a 100-message channel'),
    (['thread_open_flat', 'thread_open_flash', 'menu_open'], 'Mount: thread and context menu'),
    (['list_msg_top', 'list_msg_reorder', 'list_presence_on'], 'Re-render: channel list events'),
    (['ch_msg_new_flat', 'ch_reaction_flat', 'ch_edit_flat'], 'Re-render: open channel (FlatList)'),
    (['ch_msg_new_flash', 'ch_reaction_flash', 'ch_edit_flash'], 'Re-render: open channel (FlashList)'),
    (['ch_typing_flat', 'composer_type_flat', 'ch_own_send_flat'], 'Re-render: typing, composer, own send (FlatList)'),
]


def mode_comps(dirs):
    runs, _ = load(dirs)
    for scenarios, title in COMP_GROUPS:
        print(f'\n### {title}\n')
        print('| component | ' + ' | '.join(f'{s} base | {s} head' for s in scenarios) + ' |')
        print('|---|' + '---|---|' * len(scenarios))
        for name, label in MAJOR:
            cells, seen = [], False
            for s in scenarios:
                for side in SIDES:
                    ws = runs[side].get(s, [])
                    if not ws:
                        cells.append('-')
                        continue
                    g = lambda k: statistics.median([w['comps'].get(name, [0, 0, 0, 0])[k] for w in ws])
                    incl, rend, mnt = g(0), g(2), g(3)
                    seen = seen or bool(incl or rend or mnt)
                    cells.append(f'{incl:.1f} ({rend:.0f}r/{mnt:.0f}m)')
            if seen:
                print(f'| {label} | ' + ' | '.join(cells) + ' |')


def mode_ci(dirs, scen_groups):
    _, per = load(dirs)
    random.seed(1)

    def boot(a, b):
        base = statistics.median(b) / statistics.median(a) - 1
        bs = []
        for _ in range(20000):
            ra = [random.choice(a) for _ in a]
            rb = [random.choice(b) for _ in b]
            bs.append(statistics.median(rb) / statistics.median(ra) - 1)
        bs.sort()
        return base, bs[int(0.025 * len(bs))], bs[int(0.975 * len(bs))]

    for scens in scen_groups:
        sess = {s: [] for s in SIDES}
        for side in SIDES:
            for ws in per[side]:
                ws = [w for w in ws if w['scenario'] in scens and w.get('speed_ms')]
                if ws:
                    sess[side].append((statistics.median([w['render_ms'] for w in ws]),
                                       statistics.median([w['render_ms'] / w['speed_ms'] for w in ws]),
                                       statistics.median([w['cpu_js_ms'] for w in ws])))
        if len(sess['base']) < 3 or len(sess['head']) < 3:
            print(f'{"/".join(scens)}: need >= 3 sessions per side (have {len(sess["base"])}/{len(sess["head"])})')
            continue
        print(f'{"/".join(scens)}  sessions base/head {len(sess["base"])}/{len(sess["head"])}')
        for i, lab in ((0, 'raw render'), (1, 'render / speed index'), (2, 'JS-thread CPU')):
            e, lo, hi = boot([x[i] for x in sess['base']], [x[i] for x in sess['head']])
            print(f'   {lab:<22} {e * 100:+5.1f}%   95% CI [{lo * 100:+5.1f}%, {hi * 100:+5.1f}%]')


def mode_diff(dirs, scen, top=30):
    runs, _ = load(dirs, keep_batches=True)
    ws = {s: runs[s].get(scen, []) for s in SIDES}
    names = set()
    for s in SIDES:
        for w in ws[s]:
            names |= set(w['comps'])
    m = lambda side, n, k: statistics.median([w['comps'].get(n, [0, 0, 0, 0])[k] for w in ws[side]]) if ws[side] else 0
    rows = sorted(names, key=lambda n: -abs(m('head', n, 1) - m('base', n, 1)))
    print(f"{scen}: n={len(ws['base'])}/{len(ws['head'])}")
    print(f'{"component":<55} {"self base":>9} {"self head":>9} {"delta":>8}   renders b/h   mounts b/h')
    for n in rows[:top]:
        print(f'{n[:55]:<55} {m("base", n, 1):9.2f} {m("head", n, 1):9.2f} {m("head", n, 1) - m("base", n, 1):+8.2f}   '
              f'{m("base", n, 2):5.0f}/{m("head", n, 2):<5.0f}  {m("base", n, 3):5.0f}/{m("head", n, 3):<5.0f}')


if __name__ == '__main__':
    mode, rest = sys.argv[1], sys.argv[2:]
    if mode == 'diff':
        mode_diff(sessions(rest[1:]), rest[0])
    elif mode == 'ci':
        mode_ci(sessions(rest), [('open_channel_flat', 'x_open_flat'), ('scroll_flat', 'x_scroll_flat'),
                                 ('open_channel_flash', 'x_open_flash'), ('scroll_flash', 'x_scroll_flash'),
                                 ('cold_start',)])
    else:
        {'main': mode_main, 'lists': mode_lists, 'comps': mode_comps}[mode](sessions(rest))
