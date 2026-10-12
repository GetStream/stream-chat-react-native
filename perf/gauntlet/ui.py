#!/usr/bin/env python3
"""Tiny adb/uiautomator driver for the perf gauntlet.

Every dump goes to a fresh device path that is deleted first, and the pulled file is checked to be
new, so a failed dump can never be mistaken for the current screen (the stale-dump trap).

Usage: ui.py <serial> <command> [args]
  dump                         print a compact list of visible nodes (text / resource-id / desc / bounds)
  tap-id <prefix> [n]          tap the n-th (default 0) node whose resource-id starts with <prefix>
  tap-text <substr> [n]        tap the n-th node whose text or content-desc contains <substr>
  tap-xy <x> <y>
  has-id <prefix>              exit 0 if present
  has-text <substr>            exit 0 if present
  wait-id <prefix> [secs]      poll until present (exit 1 on timeout)
  wait-text <substr> [secs]
  wait-no-text <substr> [secs] poll until absent
  count-text <substr>          print how many nodes contain <substr>
  texts                        print all visible texts, top to bottom
  type <text>                  type into the focused field (spaces supported)
  key <keycode>
  swipe <x1> <y1> <x2> <y2> [ms]
  shot <path>                  screenshot to a local PNG
"""
import os
import re
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = shutil.which('adb') or os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')


def adb(serial, *args, check=True, timeout=None):
    return subprocess.run([ADB, '-s', serial, *args], capture_output=True, text=True, check=check, timeout=timeout)


def dump_nodes(serial):
    remote = f'/sdcard/ui-{int(time.time() * 1000)}.xml'
    local = f'/tmp/ui-{serial}.xml'
    if os.path.exists(local):
        os.remove(local)
    for _ in range(6):
        adb(serial, 'shell', 'rm', '-f', remote, check=False)
        try:
            out = adb(serial, 'shell', 'uiautomator', 'dump', remote, check=False, timeout=25)
        except subprocess.TimeoutExpired:
            # a dump that waits forever for an idle UI: kill it on the device and retry
            adb(serial, 'shell', 'pkill', '-f', 'uiautomator', check=False)
            time.sleep(1)
            continue
        if 'dumped to' in (out.stdout + out.stderr):
            adb(serial, 'pull', remote, local, check=False)
            adb(serial, 'shell', 'rm', '-f', remote, check=False)
            if os.path.exists(local) and os.path.getsize(local) > 0:
                break
        time.sleep(0.7)
    else:
        raise RuntimeError('uiautomator dump failed (screen animating?)')
    root = ET.parse(local).getroot()
    nodes = []
    for n in root.iter('node'):
        b = re.findall(r'\d+', n.get('bounds', '[0,0][0,0]'))
        x1, y1, x2, y2 = map(int, b)
        if x2 <= x1 or y2 <= y1:
            continue
        nodes.append({
            'text': n.get('text', ''),
            'id': n.get('resource-id', ''),
            'desc': n.get('content-desc', ''),
            'bounds': (x1, y1, x2, y2),
            'clickable': n.get('clickable') == 'true',
        })
    return nodes


def center(node):
    x1, y1, x2, y2 = node['bounds']
    return (x1 + x2) // 2, (y1 + y2) // 2


def by_id(nodes, prefix):
    return [n for n in nodes if n['id'].startswith(prefix)]


def by_text(nodes, sub):
    return [n for n in nodes if sub in n['text'] or sub in n['desc']]


def tap(serial, x, y):
    adb(serial, 'shell', 'input', 'tap', str(x), str(y))


def wait(serial, pred, secs):
    deadline = time.time() + secs
    while time.time() < deadline:
        try:
            if pred(dump_nodes(serial)):
                return True
        except RuntimeError:
            pass
        time.sleep(0.8)
    return False


def main():
    serial, cmd, *args = sys.argv[1:]
    if cmd == 'dump':
        for n in dump_nodes(serial):
            if n['text'] or n['id'] or n['desc']:
                print(f"{n['bounds']} id={n['id']!r} text={n['text']!r} desc={n['desc']!r}")
    elif cmd == 'texts':
        nodes = sorted(dump_nodes(serial), key=lambda n: (n['bounds'][1], n['bounds'][0]))
        for n in nodes:
            if n['text']:
                print(f"y={n['bounds'][1]:>5} {n['text']}")
    elif cmd == 'tap-id':
        idx = int(args[1]) if len(args) > 1 else 0
        found = by_id(dump_nodes(serial), args[0])
        if len(found) <= idx:
            sys.exit(f'no node with id prefix {args[0]!r} (found {len(found)})')
        tap(serial, *center(found[idx]))
    elif cmd == 'tap-text':
        idx = int(args[1]) if len(args) > 1 else 0
        found = by_text(dump_nodes(serial), args[0])
        if len(found) <= idx:
            sys.exit(f'no node with text {args[0]!r} (found {len(found)})')
        tap(serial, *center(found[idx]))
    elif cmd == 'tap-exact':
        # exact text match; with several matches, the lowest one on screen (bottom tabs) unless an index is given
        found = [n for n in dump_nodes(serial) if n['text'] == args[0] or n['desc'] == args[0]]
        if not found:
            sys.exit(f'no node with exact text {args[0]!r}')
        found.sort(key=lambda n: n['bounds'][1])
        tap(serial, *center(found[int(args[1])] if len(args) > 1 else found[-1]))
    elif cmd == 'longpress-text':
        # the LAST (lowest on screen) exact-text match, i.e. the newest message with that text
        found = [n for n in dump_nodes(serial) if n['text'] == args[0]]
        if not found:
            sys.exit(f'no node with exact text {args[0]!r}')
        found.sort(key=lambda n: n['bounds'][1])
        x, y = center(found[-1])
        adb(serial, 'shell', 'input', 'swipe', str(x), str(y), str(x), str(y), '900')
    elif cmd == 'tap-xy':
        tap(serial, int(args[0]), int(args[1]))
    elif cmd == 'has-id':
        sys.exit(0 if by_id(dump_nodes(serial), args[0]) else 1)
    elif cmd == 'has-text':
        sys.exit(0 if by_text(dump_nodes(serial), args[0]) else 1)
    elif cmd == 'wait-id':
        secs = float(args[1]) if len(args) > 1 else 30
        sys.exit(0 if wait(serial, lambda ns: by_id(ns, args[0]), secs) else 1)
    elif cmd == 'wait-text':
        secs = float(args[1]) if len(args) > 1 else 30
        sys.exit(0 if wait(serial, lambda ns: by_text(ns, args[0]), secs) else 1)
    elif cmd == 'wait-no-text':
        secs = float(args[1]) if len(args) > 1 else 30
        sys.exit(0 if wait(serial, lambda ns: not by_text(ns, args[0]), secs) else 1)
    elif cmd == 'count-text':
        print(len(by_text(dump_nodes(serial), args[0])))
    elif cmd == 'type':
        text = ' '.join(args).replace(' ', '%s')
        adb(serial, 'shell', 'input', 'text', text)
    elif cmd == 'key':
        adb(serial, 'shell', 'input', 'keyevent', args[0])
    elif cmd == 'swipe':
        ms = args[4] if len(args) > 4 else '300'
        adb(serial, 'shell', 'input', 'swipe', *args[:4], ms)
    elif cmd == 'shot':
        with open(args[0], 'wb') as f:
            f.write(subprocess.run([ADB, '-s', serial, 'exec-out', 'screencap', '-p'],
                                   capture_output=True, check=True).stdout)
    else:
        sys.exit(f'unknown command {cmd}')


if __name__ == '__main__':
    main()
