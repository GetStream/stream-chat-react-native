import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { CircleClose, CurveLineLeftUp } from '../../../icons';

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

export type InputReplyStateHeaderProps = Partial<
  Pick<MessageInputContextValue, 'clearQuotedMessageState' | 'resetInput'>
>;

export const InputReplyStateHeader = ({
  clearQuotedMessageState: propClearQuotedMessageState,
  resetInput: propResetInput,
}: InputReplyStateHeaderProps) => {
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
