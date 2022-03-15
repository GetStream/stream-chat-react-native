import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { MessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
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

export type EditingStateHeaderPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'clearEditingState' | 'resetInput'> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'>;

export const EditingStateHeaderWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  clearEditingState,
  disabled,
  resetInput,
}: EditingStateHeaderPropsWithContext<StreamChatGenerics>) => {
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
  prevProps: EditingStateHeaderPropsWithContext<StreamChatGenerics>,
  nextProps: EditingStateHeaderPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled } = prevProps;
  const { disabled: nextDisabled } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  return true;
};

const MemoizedEditingStateHeader = React.memo(
  EditingStateHeaderWithContext,
  areEqual,
) as typeof EditingStateHeaderWithContext;

export type EditingStateHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = EditingStateHeaderPropsWithContext<StreamChatGenerics>;

export const EditingStateHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: EditingStateHeaderProps<StreamChatGenerics>,
) => <MemoizedEditingStateHeader {...props} />;

EditingStateHeader.displayName = 'EditingStateHeader{messageInput}';
