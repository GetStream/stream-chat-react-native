import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
    <TouchableOpacity
      hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
      onPress={handleOnPress}
      style={[moreOptionsButton]}
      testID='more-options-button'
    >
      <CircleRight pathFill={accent_blue} />
    </TouchableOpacity>
  );
};

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
