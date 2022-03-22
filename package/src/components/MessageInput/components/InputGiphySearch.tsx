import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { CircleClose, Lightning } from '../../../icons';
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
    height: 24,
    marginRight: 8,
    paddingHorizontal: 8,
  },
  giphyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export type InputGiphySearchPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'additionalTextInputProps' | 'cooldownEndsAt' | 'setGiphyActive' | 'setShowMoreOptions'
> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'>;

export const InputGiphySearchWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalTextInputProps,
  cooldownEndsAt,
  disabled,
  setGiphyActive,
  setShowMoreOptions,
}: InputGiphySearchPropsWithContext<StreamChatGenerics>) => {
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
        <Lightning height={16} pathFill={white} width={16} />
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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: InputGiphySearchPropsWithContext<StreamChatGenerics>,
  nextProps: InputGiphySearchPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  return true;
};

const MemoizedInputGiphySearch = React.memo(
  InputGiphySearchWithContext,
  areEqual,
) as typeof InputGiphySearchWithContext;

export type InputGiphySearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<InputGiphySearchPropsWithContext<StreamChatGenerics>>;

export const InputGiphySearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: InputGiphySearchProps<StreamChatGenerics>,
) => {
  const { additionalTextInputProps, cooldownEndsAt, setGiphyActive, setShowMoreOptions } =
    useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedInputGiphySearch
      {...{ additionalTextInputProps, cooldownEndsAt, setGiphyActive, setShowMoreOptions }}
      {...props}
    />
  );
};

InputGiphySearch.displayName = 'InputGiphySearch{messageInput}';
