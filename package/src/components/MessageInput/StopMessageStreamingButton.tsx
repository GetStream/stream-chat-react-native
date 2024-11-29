import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CircleStop } from '../../icons';

export type StopMessageStreamingButtonProps = {
  /** Function that opens attachment options bottom sheet */
  onPress?: () => void;
};

export const StopMessageStreamingButton = (props: StopMessageStreamingButtonProps) => {
  const { onPress } = props;

  const {
    theme: {
      colors: { accent_blue },
      messageInput: { stopMessageStreamingButton, stopMessageStreamingIcon },
    },
  } = useTheme();

  return (
    <Pressable
      hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
      onPress={onPress}
      style={[stopMessageStreamingButton]}
      testID='more-options-button'
    >
      <CircleStop fill={accent_blue} size={32} {...stopMessageStreamingIcon} />
    </Pressable>
  );
};

StopMessageStreamingButton.displayName = 'StopMessageStreamingButton{messageInput}';
