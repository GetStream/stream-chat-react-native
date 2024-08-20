import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
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

export type InputReplyStateHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<MessageInputContextValue<StreamChatGenerics>, 'clearQuotedMessageState' | 'resetInput'>
>;

export const InputReplyStateHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  clearQuotedMessageState: propClearQuotedMessageState,
  resetInput: propResetInput,
}: InputReplyStateHeaderProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { clearQuotedMessageState: contextClearQuotedMessageState, resetInput: contextResetInput } =
    useMessageInputContext();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  const clearQuotedMessageState = propClearQuotedMessageState || contextClearQuotedMessageState;
  const resetInput = propResetInput || contextResetInput;

  return (
    <View style={[styles.replyBoxHeader, editingBoxHeader]}>
      <CurveLineLeftUp pathFill={grey_gainsboro} />
      <Text style={[styles.replyBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t<string>('Reply to Message')}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (resetInput) {
            resetInput();
          }
          if (clearQuotedMessageState) {
            clearQuotedMessageState();
          }
        }}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </TouchableOpacity>
    </View>
  );
};

InputReplyStateHeader.displayName = 'ReplyStateHeader{messageInput}';
