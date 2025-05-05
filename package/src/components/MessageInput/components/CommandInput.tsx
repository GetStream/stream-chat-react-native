import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CustomDataManagerState } from 'stream-chat';

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

export type CommandInputProps = Partial<
  Pick<
    MessageInputContextValue,
    'additionalTextInputProps' | 'cooldownEndsAt' | 'setShowMoreOptions'
  >
> & {
  disabled: boolean;
};

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
});

export const CommandInput = ({
  cooldownEndsAt: propCooldownEndsAt,
  disabled,
  setShowMoreOptions: propSetShowMoreOptions,
}: CommandInputProps) => {
  const { cooldownEndsAt: contextCooldownEndsAt, setShowMoreOptions: contextSetShowMoreOptions } =
    useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { customDataManager } = messageComposer;
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);

  const cooldownEndsAt = propCooldownEndsAt || contextCooldownEndsAt;
  const setShowMoreOptions = propSetShowMoreOptions || contextSetShowMoreOptions;

  const { seconds: cooldownRemainingSeconds } = useCountdown(cooldownEndsAt);

  const {
    theme: {
      colors: { accent_blue, grey, white },
      messageInput: {
        autoCompleteInputContainer,
        giphyCommandInput: { giphyContainer, giphyText },
      },
    },
  } = useTheme();

  const onCloseHandler = () => {
    customDataManager.setCustomData({ command: null });
    // TODO: Rethink setShowMoreOptions
    setShowMoreOptions(true);
  };

  return (
    <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
      {command ? (
        <View style={[styles.giphyContainer, { backgroundColor: accent_blue }, giphyContainer]}>
          <GiphyLightning fill={white} size={16} />
          <Text style={[styles.giphyText, { color: white }, giphyText]}>
            {command.toUpperCase()}
          </Text>
        </View>
      ) : null}

      <AutoCompleteInput cooldownActive={!!cooldownRemainingSeconds} />
      {command ? (
        <TouchableOpacity disabled={disabled} onPress={onCloseHandler} testID='close-button'>
          <CircleClose height={20} pathFill={grey} width={20} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

CommandInput.displayName = 'CommandInput{messageInput}';
