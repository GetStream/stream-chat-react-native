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

export type MessageEditedTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Pick<MessageContextValue<StreamChatGenerics>, 'message'>> & MessageTimestampProps;

export const MessageEditedTimestamp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageEditedTimestampProps<StreamChatGenerics>,
) => {
  const { message: propMessage, timestamp } = props;
  const {
    theme: {
      colors: { grey },
      messageSimple: {
        content: { editedLabel, editedTimestampContainer },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const { message: contextMessage } = useMessageContext<StreamChatGenerics>();
  const message = propMessage || contextMessage;

  if (!isEditedMessage(message)) {
    return null;
  }

  return (
    <View style={[styles.container, editedTimestampContainer]}>
      <Text style={[styles.text, { color: grey }, editedLabel]}>{t<string>('Edited') + ' '}</Text>
      <MessageTimestamp calendar={true} timestamp={timestamp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 12,
  },
});
