import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MessageTimestamp, MessageTimestampProps } from './MessageTimestamp';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { isEditedMessage } from '../../../utils/utils';

export type MessageEditedTimestampPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'message'> & MessageTimestampProps;

export const MessageEditedTimestampWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageEditedTimestampPropsWithContext<StreamChatGenerics>,
) => {
  const { message, timestamp } = props;
  const {
    theme: {
      colors: { grey },
      messageSimple: {
        content: { editedLabel, editedTimestampContainer },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  if (!isEditedMessage(message)) {
    return null;
  }

  return (
    <View style={[styles.container, editedTimestampContainer]}>
      <Text style={[styles.text, { color: grey }, editedLabel]}>{t<string>('Edited ')}</Text>
      <MessageTimestamp calendar={true} timestamp={timestamp} />
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageEditedTimestampPropsWithContext<StreamChatGenerics>,
  nextProps: MessageEditedTimestampPropsWithContext<StreamChatGenerics>,
) => {
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;
  const messageEqual = prevMessage.message_text_updated_at === nextMessage.message_text_updated_at;
  if (!messageEqual) return false;

  return true;
};

const MemoizedMessageEditedTimestamp = React.memo(
  MessageEditedTimestampWithContext,
  areEqual,
) as typeof MessageEditedTimestampWithContext;

export type MessageEditedTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageEditedTimestampPropsWithContext<StreamChatGenerics>> & MessageTimestampProps;

export const MessageEditedTimestamp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageEditedTimestampProps<StreamChatGenerics>,
) => {
  const { message } = useMessageContext<StreamChatGenerics>();
  return <MemoizedMessageEditedTimestamp<StreamChatGenerics> message={message} {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 12,
  },
});
