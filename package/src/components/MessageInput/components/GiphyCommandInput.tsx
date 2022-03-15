import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { MessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
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

export type GiphyCommandInputPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'additionalTextInputProps' | 'cooldownEndsAt' | 'setGiphyActive' | 'setShowMoreOptions'
> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'>;

export const GiphyCommandInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalTextInputProps,
  cooldownEndsAt,
  disabled,
  setGiphyActive,
  setShowMoreOptions,
}: GiphyCommandInputPropsWithContext<StreamChatGenerics>) => {
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
  prevProps: GiphyCommandInputPropsWithContext<StreamChatGenerics>,
  nextProps: GiphyCommandInputPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  return true;
};

const MemoizedGiphyCommandInput = React.memo(
  GiphyCommandInputWithContext,
  areEqual,
) as typeof GiphyCommandInputWithContext;

export type GiphyCommandInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = GiphyCommandInputPropsWithContext<StreamChatGenerics>;

export const GiphyCommandInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GiphyCommandInputProps<StreamChatGenerics>,
) => <MemoizedGiphyCommandInput {...props} />;

GiphyCommandInput.displayName = 'GiphyCommandInput{messageInput}';
