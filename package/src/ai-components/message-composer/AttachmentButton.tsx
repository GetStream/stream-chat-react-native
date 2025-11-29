import { sheetStoreApi } from '../store';
import { Pressable, StyleSheet, Text } from 'react-native';
import React from 'react';
import { PILL_HEIGHT } from './MessageComposer';

export const AttachmentButton = () => (
  <Pressable style={styles.roundButton} onPress={sheetStoreApi.openSheet}>
    <Text style={styles.attachIcon}>+</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  attachIcon: {
    fontSize: 32,
    textAlign: 'center',
    alignSelf: 'center',
    lineHeight: 32,
    color: '#7A7A7A',
  },
  roundButton: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
