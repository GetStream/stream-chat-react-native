import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { MessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { CircleClose, CurveLineLeftUp } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';

const styles = StyleSheet.create({
  replyBoxHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  replyBoxHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export type ReplyStateHeaderPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'clearQuotedMessageState' | 'resetInput'> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'>;

export const ReplyStateHeaderWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  clearQuotedMessageState,
  disabled,
  resetInput,
}: ReplyStateHeaderPropsWithContext<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.replyBoxHeader, editingBoxHeader]}>
      <CurveLineLeftUp pathFill={grey_gainsboro} />
      <Text style={[styles.replyBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t('Reply to Message')}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => {
          resetInput();
          clearQuotedMessageState();
        }}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </TouchableOpacity>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ReplyStateHeaderPropsWithContext<StreamChatGenerics>,
  nextProps: ReplyStateHeaderPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  return true;
};

const MemoizedReplyStateHeader = React.memo(
  ReplyStateHeaderWithContext,
  areEqual,
) as typeof ReplyStateHeaderWithContext;

export type ReplyStateHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ReplyStateHeaderPropsWithContext<StreamChatGenerics>;

export const ReplyStateHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReplyStateHeaderProps<StreamChatGenerics>,
) => <MemoizedReplyStateHeader {...props} />;

ReplyStateHeader.displayName = 'ReplyStateHeader{messageInput}';
