import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';

import { TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { NewCross } from '../../icons/NewCross';
import { NewGiphy } from '../../icons/NewGiphy';

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const GiphyBadge = () => {
  const {
    theme: { colors },
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
      <NewGiphy fill={colors.text.onAccent} height={16} width={16} />
      <Text style={styles.text}>{commandName}</Text>
      <Pressable onPress={onPressHandler}>
        <NewCross stroke={colors.text.onAccent} height={16} width={16} />
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { colors, spacing, radius, typography },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          backgroundColor: colors.accent.black,
          borderRadius: radius.full,
          flexDirection: 'row',
          paddingHorizontal: spacing.xs,
          paddingVertical: spacing.xxs,
          gap: spacing.xxs,
        },
        text: {
          color: colors.text.onAccent,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.lineHeight.normal,
        },
      }),
    [radius, spacing, typography, colors],
  );
};
