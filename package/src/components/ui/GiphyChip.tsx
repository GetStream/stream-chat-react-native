import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';

import { TextComposerState } from 'stream-chat';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const GiphyChip = () => {
  const { icons } = useComponentsContext();
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
    // messageComposer?.restore();
  };

  return (
    <View style={styles.container}>
      <icons.Lightning fill={semantics.textOnInverse} height={16} width={16} />
      <Text style={styles.text}>{commandName}</Text>
      <Pressable onPress={onPressHandler}>
        <icons.Cross stroke={semantics.textOnInverse} height={16} width={16} />
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
          color: semantics.textOnInverse,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [semantics],
  );
};
