#!/usr/bin/env python3
"""check.py <dir>... — correctness read-out of gauntlet sessions, from the UI snapshots session.sh takes
between windows (out/<session>/snap/*.txt) and the session's logcat. A <dir> is a session dir or a run dir.

Checks, with R = runs per scenario from meta.txt:
  list-after-events        rows start Team 2R, Bench Live (last message list-top-R), Team 2(R-1) ... Team 21
  channel-after-events-*   the last actor message shows edited (hello-<impl>-R-edited), never unedited, and the
                           last own send (benchtypingR<impl>) is shown
  list-after-channel-*     Bench Live is the first row and its preview is the last own send
  thread-after-replies-*   the thread shows bench-reply-<impl>-1..3
  logcat                   no JS errors (ReactNativeJS E) and no crash (AndroidRuntime E)
"""
import glob
import os
import re
import sys


def sessions(args):
    out = []
    for a in args:
        if os.path.exists(os.path.join(a, 'meta.txt')):
            out.append(a)
        else:
            out += sorted(d for d in glob.glob(os.path.join(a, '*')) if os.path.exists(os.path.join(d, 'meta.txt')))
    return out


def meta(d):
    m = {}
    for tok in open(os.path.join(d, 'meta.txt')).read().split():
        if '=' in tok:
            k, v = tok.split('=', 1)
            m[k] = v
    return m


def snap(d, name):
    p = os.path.join(d, 'snap', name + '.txt')
    return open(p).read() if os.path.exists(p) else None


def rows(txt):
    out = []
    for line in txt.splitlines():
        if "id='channel-preview-button'" in line:
            desc = re.search(r"desc='(.*)'$", line).group(1)
            parts = desc.split(', ')
            out.append((parts[1] if len(parts) > 1 else desc, desc))
    return out


def texts(txt):
    return [m.group(1) for m in re.finditer(r"text='([^']*)'", txt or '')]


def check(d):
    m = meta(d)
    r = int(m.get('runs', 5))
    res = []

    def add(name, ok, detail=''):
        res.append((name, ok, detail))

    t = snap(d, 'list-after-events')
    if t is not None:
        names = [n for n, _ in rows(t)]
        want = [f'Team {20 + r}', 'Bench Live'] + [f'Team {20 + k}' for k in range(r - 1, 0, -1)]
        got = names[: len(want)]
        add('list order after list events', got == want, f'got {got}')
        live = [desc for n, desc in rows(t) if n == 'Bench Live']
        add('Bench Live preview after list events', bool(live) and f'list-top-{r}' in live[0], live[0] if live else 'no row')
    for impl in ('flat', 'flash'):
        t = snap(d, f'channel-after-events-{impl}')
        if t is not None:
            tx = texts(t)
            add(f'{impl}: edited message shown', f'hello-{impl}-{r}-edited' in tx, '')
            add(f'{impl}: no unedited copy', f'hello-{impl}-{r}' not in tx, '')
            add(f'{impl}: own send shown', f'benchtyping{r}{impl}' in tx, '')
        t = snap(d, f'list-after-channel-{impl}')
        if t is not None:
            rs = rows(t)
            ok = bool(rs) and rs[0][0] == 'Bench Live' and f'benchtyping{r}{impl}' in rs[0][1]
            add(f'{impl}: list row after leaving the channel', ok, rs[0][1] if rs else 'no rows')
        t = snap(d, f'thread-after-replies-{impl}')
        if t is not None:
            tx = ' '.join(texts(t))
            missing = [k for k in (1, 2, 3) if f'bench-reply-{impl}-{k}' not in tx]
            add(f'{impl}: thread replies shown', not missing, f'missing {missing}' if missing else '')
    lc = os.path.join(d, 'logcat.txt')
    if os.path.exists(lc):
        errs = [l.strip() for l in open(lc, errors='replace') if re.search(r' E (ReactNativeJS|AndroidRuntime)', l)]
        add('no JS errors or crashes in logcat', not errs, '; '.join(e[-160:] for e in errs[:3]))
    return m.get('side', '?'), res


if __name__ == '__main__':
    for d in sessions(sys.argv[1:]):
        side, res = check(d)
        bad = [x for x in res if not x[1]]
        print(f'{os.path.basename(d)} ({side}): {len(res) - len(bad)}/{len(res)} ok')
        for name, ok, detail in res:
            if not ok:
                print(f'  FAIL {name}: {detail}')
