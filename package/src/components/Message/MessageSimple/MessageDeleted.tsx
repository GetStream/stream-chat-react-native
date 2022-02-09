import React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import merge from 'lodash/merge';

import type { MessageFooterProps } from './MessageFooter';
import { MessageTextContainer } from './MessageTextContainer';

import {
  Alignment,
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';

const styles = StyleSheet.create({
  containerInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

type MessageDeletedComponentProps = {
  formattedDate: string | Date;
  groupStyle: string;
  noBorder: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
};

type MessageDeletedPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatClient>, 'alignment' | 'message'> &
  Pick<MessagesContextValue<StreamChatClient>, 'MessageFooter'> &
  Pick<TranslationContextValue, 't'> &
  MessageDeletedComponentProps;

const MessageDeletedWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageDeletedPropsWithContext<StreamChatClient>,
) => {
  const { alignment, formattedDate, groupStyle, message, MessageFooter, noBorder, onLayout, t } =
    props;

  const {
    theme: {
      colors: { grey, grey_whisper },
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS },
          deletedContainer,
          deletedContainerInner,
          deletedText,
        },
      },
    },
  } = useTheme();

  return (
    <View
      onLayout={onLayout}
      style={[
        alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems,
        deletedContainer,
      ]}
    >
      <View
        style={[
          styles.containerInner,
          {
            backgroundColor: grey_whisper,
            borderBottomLeftRadius:
              groupStyle === 'left_bottom' || groupStyle === 'left_single'
                ? borderRadiusS
                : borderRadiusL,
            borderBottomRightRadius:
              groupStyle === 'right_bottom' || groupStyle === 'right_single'
                ? borderRadiusS
                : borderRadiusL,
            borderColor: grey_whisper,
          },
          noBorder ? { borderWidth: 0 } : {},
          deletedContainerInner,
        ]}
        testID='message-content-wrapper'
      >
        <MessageTextContainer<StreamChatClient>
          markdownStyles={merge({ em: { color: grey } }, deletedText)}
          message={{ ...message, text: `_${t('Message deleted')}_` }}
        />
      </View>
      <MessageFooter formattedDate={formattedDate} isDeleted />
    </View>
  );
};

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageDeletedPropsWithContext<StreamChatClient>,
  nextProps: MessageDeletedPropsWithContext<StreamChatClient>,
) => {
  const {
    alignment: prevAlignment,
    formattedDate: prevFormattedDate,
    message: prevMessage,
  } = prevProps;
  const {
    alignment: nextAlignment,
    formattedDate: nextFormattedDate,
    message: nextMessage,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;
  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) return false;

  const formattedDateEqual = prevFormattedDate === nextFormattedDate;
  if (!formattedDateEqual) return false;

  return true;
};

const MemoizedMessageDeleted = React.memo(
  MessageDeletedWithContext,
  areEqual,
) as typeof MessageDeletedWithContext;

export type MessageDeletedProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = MessageDeletedComponentProps & {
  alignment?: Alignment;
  message?: MessageType<StreamChatClient>;
  MessageFooter?: React.ComponentType<MessageFooterProps<StreamChatClient>>;
};

export const MessageDeleted = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageDeletedProps<StreamChatClient>,
) => {
  const { alignment, message } = useMessageContext<StreamChatClient>();

  const { MessageFooter } = useMessagesContext<StreamChatClient>();

  const { t } = useTranslationContext();

  return (
    <MemoizedMessageDeleted
      {...{
        alignment,
        message,
        MessageFooter,
        t,
      }}
      {...props}
    />
  );
};

MessageDeleted.displayName = 'MessageDeleted{messageSimple{content}}';
