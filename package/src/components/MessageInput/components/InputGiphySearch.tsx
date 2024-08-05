import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { CircleClose, GiphyLightning } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';
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

export type InputGiphySearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    'additionalTextInputProps' | 'cooldownEndsAt' | 'setGiphyActive' | 'setShowMoreOptions'
  >
> & {
  disabled: boolean;
};

export const InputGiphySearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalTextInputProps: propAdditionalTextInputProps,
  cooldownEndsAt: propCooldownEndsAt,
  disabled,
  setGiphyActive: propSetGiphyActive,
  setShowMoreOptions: propSetShowMoreOptions,
}: InputGiphySearchProps<StreamChatGenerics>) => {
  const {
    additionalTextInputProps: contextAdditionalTextInputProps,
    cooldownEndsAt: contextCooldownEndsAt,
    setGiphyActive: contextSetGiphyActive,
    setShowMoreOptions: contextSetShowMoreOptions,
  } = useMessageInputContext<StreamChatGenerics>();

  const additionalTextInputProps = propAdditionalTextInputProps || contextAdditionalTextInputProps;
  const cooldownEndsAt = propCooldownEndsAt || contextCooldownEndsAt;
  const setGiphyActive = propSetGiphyActive || contextSetGiphyActive;
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

  return (
    <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
      <View style={[styles.giphyContainer, { backgroundColor: accent_blue }, giphyContainer]}>
        <GiphyLightning fill={white} size={16} />
        <Text style={[styles.giphyText, { color: white }, giphyText]}>GIPHY</Text>
      </View>

      <AutoCompleteInput<StreamChatGenerics>
        additionalTextInputProps={additionalTextInputProps}
        cooldownActive={!!cooldownRemainingSeconds}
      />
      <TouchableOpacity
        disabled={disabled}
        onPress={() => {
          setGiphyActive(false);
          setShowMoreOptions(true);
        }}
        testID='close-button'
      >
        <CircleClose height={20} pathFill={grey} width={20} />
      </TouchableOpacity>
    </View>
  );
};

InputGiphySearch.displayName = 'InputGiphySearch{messageInput}';
