import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CircleRight } from '../../icons/CircleRight';

export type MoreOptionsButtonProps = {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

export const MoreOptionsButton = (props: MoreOptionsButtonProps) => {
  const { handleOnPress } = props;

  const {
    theme: {
      colors: { accent_blue },
      messageInput: { moreOptionsButton },
    },
  } = useTheme();

  return (
    <Pressable
      hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
      onPress={handleOnPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, moreOptionsButton]}
      testID='more-options-button'
    >
      <CircleRight pathFill={accent_blue} />
    </Pressable>
  );
};

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
