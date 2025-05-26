import React, { useCallback, useMemo } from 'react';
import type { GestureResponderEvent, PressableProps } from 'react-native';
import { Pressable, View } from 'react-native';

import { SearchSourceState, TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { Lightning } from '../../icons/Lightning';

export type CommandsButtonProps = {
  /** Function that opens commands selector */
  handleOnPress?: PressableProps['onPress'];
  /**
   * Determins if the text input has text
   */
  hasText?: boolean;
};

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export const CommandsButton = (props: CommandsButtonProps) => {
  const { handleOnPress, hasText } = props;
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } = useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const trigger = suggestions?.trigger;

  const commandsButtonEnabled = useMemo(() => {
    return items && items?.length > 0 && trigger === '/';
  }, [items, trigger]);

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
      colors: { accent_blue, grey },
      messageInput: { commandsButton, commandsButtonContainer },
    },
  } = useTheme();

  if (hasText) {
    return null;
  }

  return (
    <View style={[commandsButtonContainer]}>
      <Pressable onPress={onPressHandler} style={[commandsButton]} testID='commands-button'>
        <Lightning fill={commandsButtonEnabled ? accent_blue : grey} size={32} />
      </Pressable>
    </View>
  );
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
