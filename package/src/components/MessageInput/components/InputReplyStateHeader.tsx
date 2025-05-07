import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
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
    paddingBottom: 8,
  },
  replyBoxHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export type InputReplyStateHeaderProps = Partial<Pick<MessageInputContextValue, 'resetInput'>>;

export const InputReplyStateHeader = ({
  resetInput: propResetInput,
}: InputReplyStateHeaderProps) => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { resetInput: contextResetInput } = useMessageInputContext();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  const resetInput = propResetInput || contextResetInput;

  const onCloseHandler = () => {
    if (resetInput) {
      resetInput();
    }

    messageComposer.setQuotedMessage(null);
  };

  return (
    <View style={[styles.replyBoxHeader, editingBoxHeader]}>
      <CurveLineLeftUp pathFill={grey_gainsboro} />
      <Text style={[styles.replyBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t<string>('Reply to Message')}
      </Text>
      <Pressable
        onPress={onCloseHandler}
        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </Pressable>
    </View>
  );
};

InputReplyStateHeader.displayName = 'ReplyStateHeader{messageInput}';
