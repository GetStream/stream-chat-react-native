import React from 'react';
import { Platform, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

export const measureInWindow = (
  node: React.RefObject<View | null>,
  insets: EdgeInsets,
): Promise<{ x: number; y: number; w: number; h: number }> => {
  return new Promise((resolve, reject) => {
    const handle = node.current;
    if (!handle)
      return reject(
        new Error('The native handle could not be found while invoking measureInWindow.'),
      );

    handle.measureInWindow((x, y, w, h) =>
      resolve({ h, w, x, y: y + (Platform.OS === 'android' ? insets.top : 0) }),
    );
  });
};
