import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { NativeMessageList } from 'stream-chat-react-native';

const INITIAL = 1000;
// Variable row heights to exercise the measurement + offset path (60..210, cycling).
const rowHeight = (i: number) => 60 + (Math.abs(i) % 6) * 30;

/**
 * TEMPORARY spike for the native recycled message list. 1000 variable-height rows + buttons:
 *  - "Older" prepends 8 OLDER messages at the top (pagination) — tests MVCP: the visible anchor must
 *    NOT jump.
 *  - "+1" / "Burst" append new messages (single / irregular burst) — tests stick-to-bottom autoscroll.
 * New messages are gold, older messages purple, both labelled. Delete once wired into MessageList.
 */
export const NativeListSpikeScreen = () => {
  const [data, setData] = useState(() => Array.from({ length: INITIAL }, (_, i) => i));
  const nextId = useRef(INITIAL); // appended (new): 1000, 1001, ...
  const olderId = useRef(-1); // prepended (older): -1, -2, ...

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

  return (
    <View style={{ backgroundColor: '#111', flex: 1, paddingTop: 48 }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: '#fff', flex: 1, fontSize: 12 }}>{data.length} rows</Text>
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
      <NativeMessageList
        data={data}
        estimateItemHeight={120}
        keyExtractor={(item) => String(item)}
        renderAhead={2000}
        renderItem={({ item }) => {
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
        }}
        style={{ flex: 1 }}
      />
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
