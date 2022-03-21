import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
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

export type InputEditingStateHeaderPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'clearEditingState' | 'resetInput'> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'>;

export const InputEditingStateHeaderWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  clearEditingState,
  disabled,
  resetInput,
}: InputEditingStateHeaderPropsWithContext<StreamChatGenerics>) => {
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
    <View style={[styles.editingBoxHeader, editingBoxHeader]}>
      <Edit pathFill={grey_gainsboro} />
      <Text style={[styles.editingBoxHeaderTitle, { color: black }, editingBoxHeaderTitle]}>
        {t('Editing Message')}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => {
          resetInput();
          clearEditingState();
        }}
        testID='close-button'
      >
        <CircleClose pathFill={grey} />
      </TouchableOpacity>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: InputEditingStateHeaderPropsWithContext<StreamChatGenerics>,
  nextProps: InputEditingStateHeaderPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  return true;
};

const MemoizedInputEditingStateHeader = React.memo(
  InputEditingStateHeaderWithContext,
  areEqual,
) as typeof InputEditingStateHeaderWithContext;

export type InputEditingStateHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<InputEditingStateHeaderPropsWithContext<StreamChatGenerics>>;

export const InputEditingStateHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: InputEditingStateHeaderProps<StreamChatGenerics>,
) => {
  const { clearEditingState, resetInput } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedInputEditingStateHeader {...{ clearEditingState, resetInput }} {...props} />;
};

InputEditingStateHeader.displayName = 'EditingStateHeader{messageInput}';
