import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { CircleClose, CurveLineLeftUp } from '../../../icons';

export const InputReplyStateHeader = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  const onCloseHandler = () => {
    messageComposer.setQuotedMessage(null);
  };

  return (
    <View style={[styles.replyBoxHeader, editingBoxHeader]}>
      <CurveLineLeftUp pathFill={grey_gainsboro} />
      <Text style={[styles.replyBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t('Reply to Message')}
      </Text>
      <Pressable
        onPress={onCloseHandler}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </Pressable>
    </View>
  );
};

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

InputReplyStateHeader.displayName = 'ReplyStateHeader{messageInput}';
