import React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import merge from 'lodash/merge';

import { MessageTextContainer } from './MessageTextContainer';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

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
  groupStyle: string;
  noBorder: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  date?: string | Date;
};

type MessageDeletedPropsWithContext = Pick<MessageContextValue, 'alignment' | 'message'> &
  Pick<MessagesContextValue, 'MessageFooter'> &
  MessageDeletedComponentProps;

const MessageDeletedWithContext = (props: MessageDeletedPropsWithContext) => {
  const { alignment, date, groupStyle, message, MessageFooter, noBorder, onLayout } = props;

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
  const { t } = useTranslationContext();

  return (
    <View
      onLayout={onLayout}
      style={[
        alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems,
        deletedContainer,
      ]}
      testID='message-deleted'
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
      >
        <MessageTextContainer
          markdownStyles={merge({ em: { color: grey } }, deletedText)}
          message={{ ...message, text: `_${t('Message deleted')}_` }}
        />
      </View>
      <MessageFooter date={date} isDeleted />
    </View>
  );
};

const areEqual = (
  prevProps: MessageDeletedPropsWithContext,
  nextProps: MessageDeletedPropsWithContext,
) => {
  const { alignment: prevAlignment, date: prevDate, message: prevMessage } = prevProps;
  const { alignment: nextAlignment, date: nextDate, message: nextMessage } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }
  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) {
    return false;
  }

  const dateEqual = prevDate === nextDate;
  if (!dateEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageDeleted = React.memo(
  MessageDeletedWithContext,
  areEqual,
) as typeof MessageDeletedWithContext;

export type MessageDeletedProps = Partial<MessageDeletedPropsWithContext> & {
  groupStyle: string;
  noBorder: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
};

export const MessageDeleted = (props: MessageDeletedProps) => {
  const { alignment, message } = useMessageContext();

  const { MessageFooter } = useMessagesContext();

  return (
    <MemoizedMessageDeleted
      {...{
        alignment,
        message,
        MessageFooter,
      }}
      {...props}
    />
  );
};

MessageDeleted.displayName = 'MessageDeleted{messageSimple{content}}';
