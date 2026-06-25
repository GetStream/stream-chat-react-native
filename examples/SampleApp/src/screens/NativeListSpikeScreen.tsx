import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { NativeMessageList } from 'stream-chat-react-native';

const INITIAL = 1000;
// Variable row heights to exercise the measurement + offset path (60..210, cycling).
const rowHeight = (i: number) => 60 + (Math.abs(i) % 6) * 30;

// Trivial row — cheap to mount. Both lists scroll this about the same.
const LightRow = React.memo(function LightRow({ item }: { item: number }) {
  const isNew = item >= INITIAL;
  const isOld = item < 0;
  const bg = isOld ? '#805ad5' : isNew ? '#d69e2e' : item % 2 ? '#2b6cb0' : '#2c7a7b';
  const label = isOld ? `OLDER ${item}` : isNew ? `NEW msg ${item}` : `Row ${item}`;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderBottomColor: '#00000055',
        borderBottomWidth: 1,
        height: rowHeight(item),
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 18 }}>
        {label} ({rowHeight(item)}px)
      </Text>
    </View>
  );
});

// Simulates an expensive message row: a deep, FIXED-SHAPE view tree (avatar + header + multi-line
// bubble + reaction chips). The cost is dominated by view ALLOCATION (~40 native views), which is
// exactly what the recycle pool saves — when a pooled cell rebinds to a new item the tree is reused
// and only text updates, whereas FlatList allocates the whole tree per row mid-fling. Fixed shape
// (constant line/chip counts) maximizes reuse. Compute is kept light on purpose: the pool can't save
// per-item compute, and real message rows are allocation-heavy, not compute-heavy.
const HEAVY_ITER = 8000;
const HeavyRow = React.memo(function HeavyRow({ item }: { item: number }) {
  let acc = 0;
  for (let k = 0; k < HEAVY_ITER; k++) {
    acc += Math.sqrt(((k + Math.abs(item)) % 131) + 1);
  }
  const isNew = item >= INITIAL;
  const isOld = item < 0;
  const bg = isOld ? '#553c9a' : isNew ? '#b7791f' : item % 2 ? '#2c5282' : '#285e61';
  const lines = 6; // fixed shape → pooled cells reuse the tree across rebinds, only text updates
  const chips = 8;
  const label = isOld ? `OLDER ${item}` : isNew ? `NEW msg ${item}` : `Row ${item}`;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderBottomColor: '#00000055',
        borderBottomWidth: 1,
        flexDirection: 'row',
        height: rowHeight(item),
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <View style={heavyStyles.avatar} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={heavyStyles.name}>
            {label} · u{Math.abs(item) % 50} · {(acc % 10).toFixed(0)}
          </Text>
          <Text style={heavyStyles.time}>12:{String(Math.abs(item) % 60).padStart(2, '0')}</Text>
        </View>
        {Array.from({ length: lines }).map((_, l) => (
          <Text key={l} numberOfLines={1} style={heavyStyles.line}>
            lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod {l}
          </Text>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {Array.from({ length: chips }).map((_, c) => (
            <View key={c} style={heavyStyles.chip}>
              <Text style={heavyStyles.chipText}>👍 {c + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

/**
 * TEMPORARY spike for the native recycled message list. 1000 variable-height rows + controls:
 *  - "Native/FlatList" toggles the list implementation so we can A/B the same data + rows.
 *  - "Light/Heavy" toggles expensive rows. On LIGHT rows the two feel ~the same. On HEAVY rows,
 *    fast-fling: FlatList blanks (mounts heavy rows on demand) where our render-ahead pre-mounts.
 *    NOTE M1 has render-ahead only (no skeletons yet), so at EXTREME fling ours can blank too —
 *    the win shows in the moderate-to-fast band. The real proof is heavy rows on a real channel (#9).
 *  - "Older" prepends 8 OLDER messages (pagination) — MVCP: a plain FlatList jumps, ours holds.
 *  - "+1" / "Burst" append new messages — tests stick-to-bottom autoscroll.
 * Delete once wired into MessageList.
 */
export const NativeListSpikeScreen = () => {
  const [data, setData] = useState(() => Array.from({ length: INITIAL }, (_, i) => i));
  const nextId = useRef(INITIAL); // appended (new): 1000, 1001, ...
  const olderId = useRef(-1); // prepended (older): -1, -2, ...
  const [useNative, setUseNative] = useState(true);
  const [heavy, setHeavy] = useState(false);
  const flatListRef = useRef<FlatList<number>>(null);
  const didScrollEnd = useRef(false);

  const addOne = useCallback(() => {
    setData((prev) => [...prev, nextId.current++]);
  }, []);

  const addBurst = useCallback(() => {
    let remaining = 20 + Math.floor(Math.random() * 6);
    const tick = () => {
      const batch = Math.min(remaining, 1 + Math.floor(Math.random() * 3));
      remaining -= batch;
      setData((prev) => {
        const next = prev.slice();
        for (let i = 0; i < batch; i++) {
          next.push(nextId.current++);
        }
        return next;
      });
      if (remaining > 0) {
        setTimeout(tick, 150 + Math.random() * 600);
      }
    };
    tick();
  }, []);

  const prependOlder = useCallback(() => {
    setData((prev) => {
      const older: number[] = [];
      for (let i = 0; i < 8; i++) {
        older.unshift(olderId.current--);
      }
      return [...older, ...prev];
    });
  }, []);

  const renderRow = useCallback(
    ({ item }: { item: number }) => (heavy ? <HeavyRow item={item} /> : <LightRow item={item} />),
    [heavy],
  );

  return (
    <View style={{ backgroundColor: '#111', flex: 1, paddingTop: 48 }}>
      <View style={{ gap: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          <Text style={{ color: '#fff', flex: 1, fontSize: 12 }}>
            {data.length} rows · {heavy ? 'HEAVY' : 'light'}
          </Text>
          <Pressable
            onPress={() => {
              didScrollEnd.current = false;
              setUseNative((v) => !v);
            }}
            style={[styles.btn, { backgroundColor: useNative ? '#38a169' : '#dd6b20' }]}
          >
            <Text style={styles.btnLabel}>{useNative ? 'Native' : 'FlatList'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setHeavy((h) => !h)}
            style={[styles.btn, { backgroundColor: heavy ? '#e53e3e' : '#3182ce' }]}
          >
            <Text style={styles.btnLabel}>{heavy ? 'Heavy' : 'Light'}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable onPress={prependOlder} style={styles.btn}>
            <Text style={styles.btnLabel}>Older</Text>
          </Pressable>
          <Pressable onPress={addOne} style={styles.btn}>
            <Text style={styles.btnLabel}>+1</Text>
          </Pressable>
          <Pressable onPress={addBurst} style={styles.btn}>
            <Text style={styles.btnLabel}>Burst</Text>
          </Pressable>
        </View>
      </View>
      {useNative ? (
        <NativeMessageList
          data={data}
          estimateItemHeight={120}
          keyExtractor={(item) => String(item)}
          renderAhead={2000}
          renderItem={renderRow}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item)}
          onContentSizeChange={() => {
            if (!didScrollEnd.current) {
              didScrollEnd.current = true;
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ref={flatListRef}
          renderItem={renderRow}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
};

const styles = {
  btn: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnLabel: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
};

const heavyStyles = {
  avatar: { backgroundColor: '#ffffff55', borderRadius: 18, height: 36, width: 36 },
  chip: {
    backgroundColor: '#00000033',
    borderRadius: 10,
    marginRight: 4,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { color: '#fff', fontSize: 11 },
  line: { color: '#ffffffdd', fontSize: 12 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  time: { color: '#ffffffaa', fontSize: 11 },
};
