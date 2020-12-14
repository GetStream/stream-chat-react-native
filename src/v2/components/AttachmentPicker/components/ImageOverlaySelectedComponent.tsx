import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Check } from '../../../icons';

const styles = StyleSheet.create({
  check: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 24,
    marginRight: 8,
    marginTop: 8,
    width: 24,
  },
});

export const ImageOverlaySelectedComponent: React.FC = () => (
  <View style={styles.check}>
    <Check />
  </View>
);
