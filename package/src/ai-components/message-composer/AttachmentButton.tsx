import { sheetStoreApi } from '../store';
import { Pressable, StyleSheet, Text } from 'react-native';
import React, { useMemo } from 'react';
import { useTheme } from '../contexts';

export const AttachmentButton = () => {
  const {
    theme: {
      composer: { roundButton, attachIcon },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      style={[styles.roundButton, roundButton]}
      onPress={sheetStoreApi.openSheet}
    >
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
