import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStateStore } from '../../../hooks/useStateStore';
import { CircleClose, GiphyLightning } from '../../../icons';

import { AutoCompleteInput } from '../../AutoCompleteInput/AutoCompleteInput';
import { useCountdown } from '../hooks/useCountdown';

export type CommandInputProps = Partial<
  Pick<MessageInputContextValue, 'additionalTextInputProps' | 'cooldownEndsAt'>
> & {
  disabled: boolean;
};

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const CommandInput = ({
  cooldownEndsAt: propCooldownEndsAt,
  disabled,
}: CommandInputProps) => {
  const { cooldownEndsAt: contextCooldownEndsAt } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  const cooldownEndsAt = propCooldownEndsAt || contextCooldownEndsAt;

  const { seconds: cooldownRemainingSeconds } = useCountdown(cooldownEndsAt);

  const {
    theme: {
      colors: { accent_blue, grey, white },
      messageInput: {
        autoCompleteInputContainer,
        commandInput: { closeButton, container, text },
      },
    },
  } = useTheme();

  const onCloseHandler = () => {
    textComposer.clearCommand();
    messageComposer?.restore();
  };

  if (!command) {
    return null;
  }

  const commandName = (command.name ?? '').toUpperCase();

  return (
    <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
      <View style={[styles.giphyContainer, { backgroundColor: accent_blue }, container]}>
        <GiphyLightning fill={white} size={16} />
        <Text style={[styles.giphyText, { color: white }, text]}>{commandName}</Text>
      </View>

      <AutoCompleteInput cooldownActive={!!cooldownRemainingSeconds} />
      <Pressable
        disabled={disabled}
        onPress={onCloseHandler}
        style={({ pressed }) => {
          return [
            {
              opacity: pressed ? 0.8 : 1,
            },
            closeButton,
          ];
        }}
        testID='close-button'
      >
        <CircleClose height={20} pathFill={grey} width={20} />
      </Pressable>
    </View>
  );
};

CommandInput.displayName = 'CommandInput{messageInput}';

const styles = StyleSheet.create({
  autoCompleteInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 8,
    paddingRight: 10,
  },
  giphyContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  giphyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
