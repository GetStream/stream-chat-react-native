/* Bench probe, loaded before anything else in the bundle (see entry-shim.js).
 *
 * Needs React's PROFILING renderer (the Metro config redirects ReactFabric-prod to it), which keeps
 * fiber.actualDuration / actualStartTime and the Profiler commit hooks in a release build.
 *
 * Per React commit (fake DevTools hook, installed before the renderer loads):
 *   wall    = hook time - HostRoot.actualStartTime  (render + Fabric commit/layout + layout effects)
 *   render  = HostRoot.actualDuration               (render phase incl. host-node creation)
 *   per component name: self time, inclusive time (outermost instance only), renders, mounts
 * Root <Profiler> (AppRegistry patch): layout-effect and passive-effect durations.
 * client.dispatchEvent: synchronous event-handling time per event type.
 * Hermes heap/GC stats once a second.
 *
 * Everything is buffered and flushed to logcat once a second as `BENCH <kind> <json>` lines under 3.5k
 * chars. The host marks scenario windows with `adb shell log -t PERFMARK ...` and matches by Date.now(). */
(function () {
  var g = globalThis;
  if (g.__bench) return;
  var B = (g.__bench = { commits: 0 });
  var DIAG = false; // set by gauntlet-transformer.js in diagnostic builds only
  var pnow = function () {
    return g.performance.now();
  };

  var out = [];
  var emit = function (kind, payload) {
    out.push('BENCH ' + kind + ' ' + JSON.stringify(payload));
  };

  // Component-name table, sent incrementally.
  var nameIds = new Map();
  var newNames = [];
  var nameId = function (n) {
    var i = nameIds.get(n);
    if (i === undefined) {
      i = nameIds.size;
      nameIds.set(n, i);
      newNames.push([i, n]);
    }
    return i;
  };

  var typeName = function (t) {
    if (!t) return null;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (typeof t === 'object') {
      if (t.displayName) return t.displayName;
      if (t.render) return t.render.displayName || t.render.name || 'ForwardRef';
      if (t.type) return typeName(t.type);
    }
    return null;
  };
  var fiberName = function (f) {
    switch (f.tag) {
      case 0:
      case 1:
      case 11:
      case 15:
        return typeName(f.type) || 'Anonymous';
      case 14:
        return (typeName(f.type) || 'Anonymous') + '(memo)';
      case 5:
        return '#' + f.type;
      case 6:
        return '#text';
      case 3:
        return '#root';
      default:
        return null; // context, fragment, mode, profiler, suspense...: folded into '#other'
    }
  };
  var OTHER = '#other';

  // Per-commit accumulation (reused arrays keyed by name id).
  var selfT = [];
  var inclT = [];
  var rend = [];
  var mnt = [];
  var touched = [];
  var active = [];
  var hooks = [];
  var ctxChanges = {};
  var touch = function (id) {
    if (selfT[id] === undefined || selfT[id] === null) {
      selfT[id] = 0;
      inclT[id] = 0;
      rend[id] = 0;
      mnt[id] = 0;
      active[id] = 0;
      touched.push(id);
    }
  };

  var walk = function (root) {
    // Iterative DFS over the fibers React processed in this commit; enter/exit markers keep an
    // "already inside a same-named fiber" count so inclusive time is counted once per subtree.
    var stack = [root];
    var exits = [false];
    while (stack.length) {
      var f = stack.pop();
      var isExit = exits.pop();
      var n = fiberName(f);
      var id = nameId(n || OTHER);
      if (isExit) {
        active[id] -= 1;
        continue;
      }
      touch(id);
      var alt = f.alternate;
      var dur = f.actualDuration > 0 ? f.actualDuration : 0;
      var childSum = 0;
      var reconciled = !alt || f.child !== alt.child;
      if (n !== null && active[id] === 0) inclT[id] += dur;
      active[id] += 1;
      stack.push(f);
      exits.push(true);
      if (reconciled) {
        for (var c = f.child; c; c = c.sibling) {
          childSum += c.actualDuration > 0 ? c.actualDuration : 0;
          stack.push(c);
          exits.push(false);
        }
      }
      var self = dur - childSum;
      selfT[id] += self > 0 ? self : 0;
      if (f.tag === 0 || f.tag === 1 || f.tag === 11 || f.tag === 15) {
        if (f.flags & 1) rend[id] += 1;
      }
      if (!alt) mnt[id] += 1;
      // Diagnostic builds: context providers whose value changed identity in this commit.
      if (
        DIAG &&
        f.tag === 10 &&
        alt &&
        alt.memoizedProps &&
        f.memoizedProps &&
        alt.memoizedProps.value !== f.memoizedProps.value
      ) {
        var cx = f.type && (f.type._context || f.type);
        var v = f.memoizedProps.value;
        var cname =
          (cx && cx.displayName) ||
          'ctx{' +
            (v && typeof v === 'object' ? Object.keys(v).slice(0, 4).join(',') : typeof v) +
            '}';
        var changed = '';
        if (
          v &&
          typeof v === 'object' &&
          alt.memoizedProps.value &&
          typeof alt.memoizedProps.value === 'object'
        ) {
          var ov = alt.memoizedProps.value;
          changed = Object.keys(v)
            .filter(function (k) {
              return v[k] !== ov[k];
            })
            .slice(0, 6)
            .join(',');
        }
        ctxChanges[cname + ' [' + changed + ']'] =
          (ctxChanges[cname + ' [' + changed + ']'] || 0) + 1;
      }
      // Diagnostic builds: hooks per mounted function component (length of the hook list).
      if (DIAG && !alt && (f.tag === 0 || f.tag === 11 || f.tag === 15)) {
        var hk = 0;
        for (var h = f.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next)
          hk += 1;
        hooks[id] = (hooks[id] || 0) + hk;
      }
    }
  };

  var r2 = function (x) {
    return Math.round(x * 100) / 100;
  };

  var installHook = function () {
    var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) {
      var rid = 0;
      hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true,
        renderers: new Map(),
        inject: function (r) {
          rid += 1;
          this.renderers.set(rid, r);
          return rid;
        },
        onScheduleFiberRoot: function () {},
        onCommitFiberRoot: function () {},
        onCommitFiberUnmount: function () {},
        onPostCommitFiberRoot: function () {},
        checkDCE: function () {},
      };
    }
    var orig = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function (rendererID, root) {
      var tHook = pnow();
      var ts = Date.now();
      try {
        var cur = root && root.current;
        if (cur) {
          B.commits += 1;
          var wall = cur.actualStartTime >= 0 ? tHook - cur.actualStartTime : -1;
          var render = cur.actualDuration > 0 ? cur.actualDuration : 0;
          touched.length = 0;
          walk(cur);
          var rows = [];
          for (var i = 0; i < touched.length; i++) {
            var id = touched[i];
            if (selfT[id] > 0.004 || inclT[id] > 0.004 || rend[id] || mnt[id]) {
              rows.push(
                DIAG
                  ? [id, r2(selfT[id]), r2(inclT[id]), rend[id], mnt[id], hooks[id] || 0]
                  : [id, r2(selfT[id]), r2(inclT[id]), rend[id], mnt[id]],
              );
              hooks[id] = 0;
            }
            selfT[id] = null;
          }
          emit('C', [B.commits, ts, r2(wall), r2(render), r2(pnow() - tHook)]);
          for (var k = 0; k < rows.length; k += 110) {
            emit('D', [B.commits, rows.slice(k, k + 110)]);
          }
        }
      } catch (e) {
        emit('ERR', String(e && e.stack));
      }
      return orig && orig.apply(this, arguments);
    };
  };
  installHook();

  // Root Profiler: layout / passive effect durations.
  var React = require('react');
  var RN = require('react-native');
  var onCommit = function (id, phase, effectDuration) {
    emit('L', [Date.now(), r2(effectDuration)]);
  };
  var onPostCommit = function (id, phase, passiveDuration) {
    emit('P', [Date.now(), r2(passiveDuration)]);
  };
  var origReg = RN.AppRegistry.registerComponent;
  RN.AppRegistry.registerComponent = function (key, getComponent, section) {
    return origReg.call(
      this,
      key,
      function () {
        var C = getComponent();
        var Wrapped = function (props) {
          return React.createElement(
            React.Profiler,
            { id: 'gauntlet-root', onCommit: onCommit, onPostCommit: onPostCommit },
            React.createElement(C, props),
          );
        };
        return Wrapped;
      },
      section,
    );
  };

  // LLC event handling: see probe-llc.js (an ES module, so it gets the same stream-chat build as the app).
  B.emit = emit;
  B.pnow = pnow;
  B.r2 = r2;

  var heap = function () {
    var H = g.HermesInternal;
    var s = H && H.getInstrumentedStats ? H.getInstrumentedStats() : null;
    if (s) {
      emit('H', [
        Date.now(),
        s.js_numGCs,
        r2(s.js_gcCPUTime || 0),
        r2(s.js_gcTime || 0),
        s.js_heapSize,
        s.js_allocatedBytes,
      ]);
    }
  };

  // Loaded-message counts of the Bench channels, logged when they change (proves "100 loaded").
  var lastCounts = {};
  var counts = function () {
    var client = B.client;
    if (!client) return;
    // v10 keeps channels in client.channelManager, v9 in client.activeChannels.
    var list =
      client.channelManager && client.channelManager.values
        ? client.channelManager.values()
        : Object.keys(client.activeChannels || {}).map(function (k) {
            return client.activeChannels[k];
          });
    var cids = list.map(function (c) {
      return c && c.cid;
    });
    for (var i = 0; i < list.length; i++) {
      var ch = list[i];
      var d = ch && ch.data;
      var name = d && (d.name || (d.custom && d.custom.name));
      if (!name || String(name).indexOf('Bench') !== 0) continue;
      var n = -1;
      try {
        n = ch.messagePaginator
          ? (ch.messagePaginator.state.getLatestValue().items || []).length
          : ch.state.messages.length;
      } catch (e) {}
      if (lastCounts[cids[i]] !== n) {
        lastCounts[cids[i]] = n;
        emit('M', [Date.now(), String(name), n]);
      }
    }
  };

  // Diagnostic builds only (GAUNTLET_DIAG): which Message areEqual check failed.
  var ae = {};
  g.__benchAreEqual = function (k) {
    ae[k] = (ae[k] || 0) + 1;
  };

  // Speed index: a fixed amount of JS work timed once a second. The emulator can run on slower or
  // faster host cores; this shows which, per window, independent of the code under test.
  // Two probes: a tight arithmetic loop (CPU speed) and a memory-heavy one (allocate and walk ~1 MB of
  // objects). React work is memory-heavy: when the host compresses or swaps the emulator's RAM, the second
  // slows down (several x) while the first does not.
  var calibrate = function () {
    var t0 = pnow();
    var x = 0;
    for (var i = 0; i < 50000; i++) x = (x + i * 7) % 1000003;
    var arith = pnow() - t0;
    t0 = pnow();
    var objs = [];
    for (var j = 0; j < 20000; j++) objs.push({ a: j, b: 'k' + (j % 97), c: [j, j + 1] });
    var sum = 0;
    for (var k = objs.length - 1; k >= 0; k -= 7)
      sum += objs[k].a + objs[k].c[1] + objs[k].b.length;
    emit('S', [Date.now(), r2(arith), x, r2(pnow() - t0), sum]);
  };

  var flush = function () {
    calibrate();
    if (Object.keys(ctxChanges).length) {
      emit('X', [Date.now(), ctxChanges]);
      ctxChanges = {};
    }
    if (Object.keys(ae).length) {
      emit('A', [Date.now(), ae]);
      ae = {};
    }
    try {
      counts();
    } catch (e) {}
    if (newNames.length) {
      for (var k = 0; k < newNames.length; k += 60) emit('N', newNames.slice(k, k + 60));
      newNames = [];
      // names must precede the commits that use them: move them to the front of this flush
      var nLines = out.filter(function (l) {
        return l.indexOf('BENCH N ') === 0;
      });
      var rest = out.filter(function (l) {
        return l.indexOf('BENCH N ') !== 0;
      });
      out = nLines.concat(rest);
    }
    heap();
    var lines = out;
    out = [];
    for (var i = 0; i < lines.length; i++) console.log(lines[i]);
  };
  setInterval(flush, 1000);
  emit('I', [
    'probe installed',
    typeof g.HermesInternal,
    g.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'hook' : 'nohook',
  ]);
})();
