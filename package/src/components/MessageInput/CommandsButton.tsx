import React, { useCallback } from 'react';
import type { GestureResponderEvent, PressableProps } from 'react-native';
import { Pressable } from 'react-native';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Lightning } from '../../icons/Lightning';

export type CommandsButtonProps = {
  /** Function that opens commands selector. */
  handleOnPress?: PressableProps['onPress'];
};

export const CommandsButton = (props: CommandsButtonProps) => {
  const { handleOnPress } = props;
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;

  const onPressHandler = useCallback(
    async (event: GestureResponderEvent) => {
      if (handleOnPress) {
        handleOnPress(event);
        return;
      }

      await textComposer.handleChange({
        selection: {
          end: 1,
          start: 1,
        },
        text: '/',
      });
    },
    [handleOnPress, textComposer],
  );

  const {
    theme: {
      colors: { grey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <Pressable onPress={onPressHandler} style={[commandsButton]} testID='commands-button'>
      <Lightning fill={grey} size={32} />
    </Pressable>
  );
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
