import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { NativeMessageList } from 'stream-chat-react-native';

const INITIAL = 1000;
// Variable row heights to exercise the measurement + offset path (60..210, cycling).
const rowHeight = (i: number) => 60 + (i % 6) * 30;

/**
 * TEMPORARY spike for the native recycled message list. 1000 variable-height rows + two buttons that
 * append new messages — a single one, or an irregular burst (20-25 messages, 1-3 at a time, random
 * gaps) mimicking a busy channel — so we can verify stick-to-bottom autoscroll, no-jump when scrolled
 * up, and robustness under bursty incoming traffic. New messages are gold + labelled. Delete once
 * wired into MessageList.
 */
export const NativeListSpikeScreen = () => {
  const [data, setData] = useState(() => Array.from({ length: INITIAL }, (_, i) => i));
  const nextId = useRef(INITIAL);

  const addOne = useCallback(() => {
    setData((prev) => [...prev, nextId.current++]);
  }, []);

  // 20-25 messages, 1-3 at a time, with 150-750ms random gaps — a bursty incoming feed.
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

  return (
    <View style={{ backgroundColor: '#111', flex: 1, paddingTop: 48 }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: '#fff', flex: 1, fontSize: 14 }}>
          Native list — {data.length} rows
        </Text>
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
          return (
            <View
              style={{
                backgroundColor: isNew ? '#d69e2e' : item % 2 ? '#2b6cb0' : '#2c7a7b',
                borderBottomColor: '#00000055',
                borderBottomWidth: 1,
                height: rowHeight(item),
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18 }}>
                {isNew ? `NEW msg ${item}` : `Row ${item}`} ({rowHeight(item)}px)
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnLabel: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
};
