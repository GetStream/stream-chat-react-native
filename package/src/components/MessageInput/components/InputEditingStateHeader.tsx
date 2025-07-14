import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MessageComposerAPIContextValue,
  useMessageComposerAPIContext,
} from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { CircleClose, Edit } from '../../../icons';

export type InputEditingStateHeaderProps = Partial<
  Pick<MessageComposerAPIContextValue, 'clearEditingState'>
>;

export const InputEditingStateHeader = ({
  clearEditingState: propClearEditingState,
}: InputEditingStateHeaderProps) => {
  const messageComposer = useMessageComposer();
  const { t } = useTranslationContext();
  const { clearEditingState: contextClearEditingState } = useMessageComposerAPIContext();

  const clearEditingState = propClearEditingState || contextClearEditingState;

  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  const onCloseHandler = useCallback(() => {
    if (clearEditingState) {
      clearEditingState();
    }
    messageComposer.restore();
  }, [clearEditingState, messageComposer]);

  return (
    <View style={[styles.editingBoxHeader, editingBoxHeader]}>
      <Edit pathFill={grey_gainsboro} />
      <Text style={[styles.editingBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t('Editing Message')}
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
  editingBoxHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  editingBoxHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

InputEditingStateHeader.displayName = 'EditingStateHeader{messageInput}';
