import React from 'react';
import { Text, View } from 'react-native';

import { NativeMessageList } from 'stream-chat-react-native';

// Variable row heights to exercise the measurement + offset path (60..210, cycling).
const rowHeight = (i: number) => 60 + (i % 6) * 30;

/**
 * TEMPORARY variable-height windowing spike for the native recycled message list.
 * 1000 rows of varying heights: validates per-cell measurement, prefix-sum offsets, and that only a
 * window (+ render-ahead) is mounted while native scrolling stays smooth. Delete once wired into MessageList.
 */
export const NativeListSpikeScreen = () => {
  const data = React.useMemo(() => Array.from({ length: 1000 }, (_, i) => i), []);
  return (
    <View style={{ backgroundColor: '#111', flex: 1, paddingTop: 48 }}>
      <Text style={{ color: '#fff', fontSize: 16, padding: 12 }}>
        Native list spike — {data.length} rows (variable height)
      </Text>
      <NativeMessageList
        data={data}
        estimateItemHeight={120}
        renderAhead={2000}
        renderItem={({ index, item }) => (
          <View
            style={{
              backgroundColor: index % 2 ? '#2b6cb0' : '#2c7a7b',
              borderBottomColor: '#00000055',
              borderBottomWidth: 1,
              height: rowHeight(item),
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>
              Row {item} ({rowHeight(item)}px)
            </Text>
          </View>
        )}
        style={{ flex: 1 }}
      />
    </View>
  );
};
