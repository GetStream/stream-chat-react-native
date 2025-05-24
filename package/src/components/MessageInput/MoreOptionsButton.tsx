import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CircleRight } from '../../icons/CircleRight';

export type MoreOptionsButtonProps = {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: () => void;
};

export const UnMemoizedMoreOptionsButton = (props: MoreOptionsButtonProps) => {
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
      style={({ pressed }) => [moreOptionsButton, { opacity: pressed ? 0.8 : 1 }]}
      testID='more-options-button'
    >
      <CircleRight pathFill={accent_blue} />
    </Pressable>
  );
};

export const MoreOptionsButton = React.memo(UnMemoizedMoreOptionsButton);

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
