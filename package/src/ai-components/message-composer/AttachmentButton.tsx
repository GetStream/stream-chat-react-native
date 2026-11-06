import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { useTheme } from '../contexts';
import { sheetStoreApi } from '../store';

// The sheet opens once the keyboard has closed. A sheet opening over the keyboard takes the focus
// from the composer: on Android the keyboard then closes with stray events, which move the
// conversation following it too far, and again as the sheet closes.
const openSheet = () => {
  void KeyboardController.dismiss().then(sheetStoreApi.openSheet);
};

export const AttachmentButton = () => {
  const {
    theme: {
      composer: { roundButton, attachIcon },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <Pressable style={[styles.roundButton, roundButton]} onPress={openSheet}>
      <Text style={[styles.attachIcon, attachIcon]}>+</Text>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    const { colors, composer } = theme;

    const pillHeight = composer.inputPillHeight;

    return StyleSheet.create({
      attachIcon: {
        fontSize: 32,
        textAlign: 'center',
        alignSelf: 'center',
        lineHeight: 32,
        color: colors.grey,
      },
      roundButton: {
        width: pillHeight,
        height: pillHeight,
        borderRadius: pillHeight / 2,
        backgroundColor: colors.white_smoke,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
      },
    });
  }, [theme]);
};
