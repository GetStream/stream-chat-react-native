import React, { useMemo } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';

import { SearchSourceState, TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { Lightning } from '../../icons/Lightning';

export type CommandsButtonProps = {
  /** Function that opens commands selector */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export const CommandsButton = (props: CommandsButtonProps) => {
  const { handleOnPress } = props;
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions, text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } = useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const trigger = suggestions?.trigger;
  const queryText = suggestions?.query;

  const commandsButtonEnabled = useMemo(() => {
    return items && items?.length > 0 && queryText && trigger === '/';
  }, [items, queryText, trigger]);

  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { commandsButton },
    },
  } = useTheme();

  if (text) {
    return null;
  }

  return (
    <Pressable onPress={handleOnPress} style={[commandsButton]} testID='commands-button'>
      <Lightning fill={commandsButtonEnabled ? accent_blue : grey} size={32} />
    </Pressable>
  );
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
