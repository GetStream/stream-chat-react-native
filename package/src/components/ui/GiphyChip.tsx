import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';

import { TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { Cross } from '../../icons/Cross';
import { Lightning } from '../../icons/Lightning';
import { primitives } from '../../theme';

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const GiphyChip = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  const commandName = (command?.name ?? '').toUpperCase();

  const onPressHandler = () => {
    textComposer.clearCommand();
    messageComposer?.restore();
  };

  return (
    <View style={styles.container}>
      <Lightning fill={semantics.textInverse} height={16} width={16} />
      <Text style={styles.text}>{commandName}</Text>
      <Pressable onPress={onPressHandler}>
        <Cross stroke={semantics.textInverse} height={16} width={16} />
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          backgroundColor: semantics.badgeBgInverse,
          borderRadius: primitives.radiusMax,
          flexDirection: 'row',
          paddingHorizontal: primitives.spacingXs,
          paddingVertical: primitives.spacingXxxs,
          gap: primitives.spacingXxs,
          height: 24,
        },
        text: {
          color: semantics.textInverse,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [semantics],
  );
};
