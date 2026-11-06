import React from 'react';
import { Alert } from 'react-native';

import {
  MessageComposerAPIContextValue,
  useMessageComposerAPIContext,
} from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { MessageOperations, useMessageOperations } from '../hooks/useMessageOperations';

export type MessageBouncePropsWithContext = Pick<
  MessageOperations,
  'removeMessage' | 'retrySendMessage'
> &
  Pick<MessageContextValue, 'message'> & {
    setIsBounceDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  } & Pick<MessageComposerAPIContextValue, 'setEditingState'>;

export const MessageBounceWithContext = (props: MessageBouncePropsWithContext) => {
  const { t } = useTranslationContext();
  const { message, removeMessage, retrySendMessage, setEditingState, setIsBounceDialogOpen } =
    props;

  const handleEditMessage = () => {
    setEditingState(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  };

  const handleResend = () => {
    retrySendMessage(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  };

  const handleRemoveMessage = async () => {
    await removeMessage(message);
    if (setIsBounceDialogOpen) {
      setIsBounceDialogOpen(false);
    }
  };

  return (
    <>
      {Alert.alert(
        t('message.bounce.title', 'Are you sure?'),
        t(
          'message.bounce.text',
          'Consider how your comment might make others feel and be sure to follow our Community Guidelines',
        ),
        [
          { onPress: handleResend, text: t('message.bounce.sendAnyway.label', 'Send Anyway') },
          { onPress: handleEditMessage, text: t('message.editMessage.label', 'Edit Message') },
          {
            onPress: handleRemoveMessage,
            text: t('message.deleteMessage.label', 'Delete Message'),
          },
        ],
        { cancelable: true },
      )}
    </>
  );
};

const areEqual = (
  prevProps: MessageBouncePropsWithContext,
  nextProps: MessageBouncePropsWithContext,
) => {
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;
  const messageEqual =
    prevMessage.cid === nextMessage.cid &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text;
  if (!messageEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageBounce = React.memo(
  MessageBounceWithContext,
  areEqual,
) as typeof MessageBounceWithContext;

export type MessageBounceProps = Partial<MessageBouncePropsWithContext> & {
  setIsBounceDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const MessageBounce = (props: MessageBounceProps) => {
  const { message } = useMessageContext();
  const { removeMessage, retrySendMessage } = useMessageOperations();
  const { setEditingState } = useMessageComposerAPIContext();
  return (
    <MemoizedMessageBounce
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
