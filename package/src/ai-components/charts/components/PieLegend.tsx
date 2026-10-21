import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Datum } from '../types';

export const PieLegend = ({ items, maxRows = 3 }: { items: Datum[]; maxRows?: number }) => {
  return (
    <View style={styles.container}>
      {items.slice(0, maxRows * 4).map((item, i) => (
        <View key={`${item.dimension}-${i}`} style={styles.item}>
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: item.color,
              },
            ]}
          />
          <Text numberOfLines={1} style={styles.label}>
            {item.dimension}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '48%', // Two items per row.
  },
  swatch: {
    borderRadius: 2,
    width: 12,
    height: 12,
  },
  label: {
    fontSize: 13,
  },
});
