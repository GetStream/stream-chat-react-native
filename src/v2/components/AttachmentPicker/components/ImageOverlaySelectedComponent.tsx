import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Check } from '../../../icons';

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
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
