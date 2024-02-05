import React, { useCallback } from 'react';
import { Alert } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type MessageBouncePropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessagesContextValue<StreamChatGenerics>,
  'setEditingState' | 'removeMessage' | 'retrySendMessage'
> &
  Pick<MessageContextValue<StreamChatGenerics>, 'message'> & {
    isBounceDialogOpen?: boolean;
    setIsBounceDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  };

export const MessageBounceWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageBouncePropsWithContext<StreamChatGenerics>,
) => {
  const { t } = useTranslationContext();
  const { message, removeMessage, retrySendMessage, setEditingState, setIsBounceDialogOpen } =
    props;

  const handleEditMessage = useCallback(() => {
    setEditingState(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  }, [message, setEditingState]);

  const handleResend = useCallback(() => {
    retrySendMessage(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  }, [message, retrySendMessage]);

  const handleRemoveMessage = useCallback(() => {
    removeMessage(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  }, [message, removeMessage]);

  return (
    <>
      {Alert.alert(
        t('Are you sure?'),
        t(
          'Consider how your comment might make others feel and be sure to follow our Community Guidelines',
        ),
        [
          { onPress: handleResend, text: t('Send Anyway') },
          { onPress: handleEditMessage, text: t('Edit Message') },
          { onPress: handleRemoveMessage, text: t('Delete Message') },
        ],
        { cancelable: true },
      )}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageBouncePropsWithContext<StreamChatGenerics>,
  nextProps: MessageBouncePropsWithContext<StreamChatGenerics>,
) => {
  const { isBounceDialogOpen: prevIsBounceDialogOpen, message: prevMessage } = prevProps;
  const { isBounceDialogOpen: nextIsBounceDialogOpen, message: nextMessage } = nextProps;
  const messageEqual =
    prevMessage.cid === nextMessage.cid &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text;
  if (!messageEqual) return false;

  if (prevIsBounceDialogOpen === nextIsBounceDialogOpen) return false;

  return true;
};

const MemoizedMessageBounce = React.memo(
  MessageBounceWithContext,
  areEqual,
) as typeof MessageBounceWithContext;

export type MessageBounceProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageBouncePropsWithContext<StreamChatGenerics>>;

export const MessageBounce = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageBounceProps<StreamChatGenerics>,
) => {
  const { message } = useMessageContext<StreamChatGenerics>();
  const { removeMessage, retrySendMessage, setEditingState } =
    useMessagesContext<StreamChatGenerics>();
  return (
    <MemoizedMessageBounce<StreamChatGenerics>
      {...{
        message,
        removeMessage,
        retrySendMessage,
        setEditingState,
      }}
      {...props}
    />
  );
};
