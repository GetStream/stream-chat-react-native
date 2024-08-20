import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { CircleClose, Edit } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';

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

export type InputEditingStateHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Pick<MessageInputContextValue<StreamChatGenerics>, 'clearEditingState' | 'resetInput'>>;

export const InputEditingStateHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  clearEditingState: propClearEditingState,
  resetInput: propResetInput,
}: InputEditingStateHeaderProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { clearEditingState: contextClearEditingState, resetInput: contextResetInput } =
    useMessageInputContext<StreamChatGenerics>();

  const clearEditingState = propClearEditingState || contextClearEditingState;
  const resetInput = propResetInput || contextResetInput;

  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      messageInput: {
        editingStateHeader: { editingBoxHeader, editingBoxHeaderTitle },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.editingBoxHeader, editingBoxHeader]}>
      <Edit pathFill={grey_gainsboro} />
      <Text style={[styles.editingBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t<string>('Editing Message')}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (resetInput) {
            resetInput();
          }
          if (clearEditingState) {
            clearEditingState();
          }
        }}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </TouchableOpacity>
    </View>
  );
};

InputEditingStateHeader.displayName = 'EditingStateHeader{messageInput}';
