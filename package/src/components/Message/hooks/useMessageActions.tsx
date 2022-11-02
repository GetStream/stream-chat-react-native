import React from 'react';
import { Alert } from 'react-native';

import { useMessageActionHandlers } from './useMessageActionHandlers';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import type { OverlayContextValue } from '../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import {
  Copy,
  CurveLineLeftUp,
  Delete,
  Edit,
  MessageFlag,
  Mute,
  Pin,
  SendUp,
  ThreadReply,
  Unpin,
  UserDelete,
} from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageStatusTypes } from '../../../utils/utils';

import type { MessageType } from '../../MessageList/hooks/useMessageList';
import type { MessageActionType } from '../../MessageOverlay/MessageActionListItem';
import { removeReservedFields } from '../utils/removeReservedFields';
import { setClipboardString } from '../../../native';

export const useMessageActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  client,
  enforceUniqueReaction,
  handleBlock,
  handleCopy,
  handleDelete,
  handleEdit,
  handleFlag,
  handleMute,
  handlePinMessage,
  handleQuotedReply,
  handleReaction: handleReactionProp,
  handleRetry,
  handleThreadReply,
  message,
  onThreadSelect,
  openThread,
  removeMessage,
  retrySendMessage,
  selectReaction,
  setEditingState,
  setOverlay,
  setQuotedMessageState,
  supportedReactions,
  t,
  updateMessage,
}: Pick<
  MessagesContextValue<StreamChatGenerics>,
  | 'handleBlock'
  | 'handleCopy'
  | 'handleDelete'
  | 'handleEdit'
  | 'handleFlag'
  | 'handleQuotedReply'
  | 'handleMute'
  | 'handlePinMessage'
  | 'handleRetry'
  | 'handleReaction'
  | 'handleThreadReply'
  | 'removeMessage'
  | 'retrySendMessage'
  | 'setEditingState'
  | 'setQuotedMessageState'
  | 'selectReaction'
  | 'supportedReactions'
  | 'updateMessage'
> &
  Pick<ChannelContextValue<StreamChatGenerics>, 'channel' | 'enforceUniqueReaction'> &
  Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<OverlayContextValue, 'setOverlay'> &
  Pick<ThreadContextValue<StreamChatGenerics>, 'openThread'> &
  Pick<MessageContextValue<StreamChatGenerics>, 'message'> &
  Pick<TranslationContextValue, 't'> & {
    onThreadSelect?: (message: MessageType<StreamChatGenerics>) => void;
  }) => {
  const {
    theme: {
      colors: { accent_blue, accent_red, grey },
    },
  } = useTheme();
  const {
    handleDeleteMessage,
    handleEditMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleTogglePinMessage,
    handleToggleReaction,
  } = useMessageActionHandlers({
    channel,
    client,
    enforceUniqueReaction,
    message,
    removeMessage,
    retrySendMessage,
    setEditingState,
    setQuotedMessageState,
    supportedReactions,
    updateMessage,
  });

  const error = message.type === 'error' || message.status === MessageStatusTypes.FAILED;

  const onOpenThread = () => {
    if (onThreadSelect) {
      onThreadSelect(message);
    }
    if (openThread) {
      openThread(message);
    }
  };

  const isMuted = (client.mutedUsers || []).some(
    (mute) => mute.user.id === client.userID && mute.target.id === message.user?.id,
  );

  const blockUser: MessageActionType = {
    action: async () => {
      setOverlay('none');
      if (message.user?.id) {
        if (handleBlock) {
          handleBlock(message);
        }

        await handleToggleBanUser();
      }
    },
    actionType: 'blockUser',
    icon: <UserDelete pathFill={grey} />,
    title: message.user?.banned ? t('Unblock User') : t('Block User'),
  };

  const copyMessage: MessageActionType | false = setClipboardString !== null && {
    action: () => {
      console.log({ setClipboardString });
      setOverlay('none');
      if (handleCopy) {
        handleCopy(message);
      }
      setClipboardString(message.text || '');
    },
    actionType: 'copyMessage',
    icon: <Copy pathFill={grey} />,
    title: t('Copy Message'),
  };

  const deleteMessage: MessageActionType = {
    action: () => {
      setOverlay('alert');
      if (message.id) {
        Alert.alert(
          t('Delete Message'),
          t('Are you sure you want to permanently delete this message?'),
          [
            { onPress: () => setOverlay('none'), text: t('Cancel') },
            {
              onPress: async () => {
                setOverlay('none');
                if (handleDelete) {
                  handleDelete(message);
                }

                await handleDeleteMessage();
              },
              style: 'destructive',
              text: t('Delete'),
            },
          ],
          { cancelable: false },
        );
      }
    },
    actionType: 'deleteMessage',
    icon: <Delete pathFill={accent_red} />,
    title: t('Delete Message'),
    titleStyle: { color: accent_red },
  };

  const editMessage: MessageActionType = {
    action: () => {
      setOverlay('none');
      if (handleEdit) {
        handleEdit(message);
      }
      handleEditMessage();
    },
    actionType: 'editMessage',
    icon: <Edit pathFill={grey} />,
    title: t('Edit Message'),
  };

  const pinMessage: MessageActionType = {
    action: () => {
      setOverlay('none');
      if (handlePinMessage) {
        handlePinMessage(message);
      }
      handleTogglePinMessage();
    },
    actionType: 'pinMessage',
    icon: <Pin height={23} pathFill={grey} width={24} />,
    title: t('Pin to Conversation'),
  };

  const unpinMessage: MessageActionType = {
    action: () => {
      setOverlay('none');
      if (handlePinMessage) {
        handlePinMessage(message);
      }
      handleTogglePinMessage();
    },
    actionType: 'unpinMessage',
    icon: <Unpin pathFill={grey} />,
    title: t('Unpin from Conversation'),
  };

  const flagMessage: MessageActionType = {
    action: () => {
      setOverlay('alert');
      if (message.id) {
        Alert.alert(
          t('Flag Message'),
          t('Do you want to send a copy of this message to a moderator for further investigation?'),
          [
            { onPress: () => setOverlay('none'), text: t('Cancel') },
            {
              onPress: async () => {
                try {
                  if (handleFlag) {
                    handleFlag(message);
                  }
                  await client.flagMessage(message.id);
                  Alert.alert(
                    t('Message flagged'),
                    t('The message has been reported to a moderator.'),
                    [
                      {
                        onPress: () => setOverlay('none'),
                        text: t('Ok'),
                      },
                    ],
                  );
                } catch (_) {
                  Alert.alert(
                    t('Cannot Flag Message'),
                    t(
                      'Flag action failed either due to a network issue or the message is already flagged',
                    ),
                    [
                      {
                        onPress: () => setOverlay('none'),
                        text: t('Ok'),
                      },
                    ],
                  );
                }
              },
              text: t('Flag'),
            },
          ],
          { cancelable: false },
        );
      }
    },
    actionType: 'flagMessage',
    icon: <MessageFlag pathFill={grey} />,
    title: t('Flag Message'),
  };

  const handleReaction = !error
    ? selectReaction
      ? selectReaction(message)
      : async (reactionType: string) => {
          if (handleReactionProp) {
            handleReactionProp(message, reactionType);
          }

          await handleToggleReaction(reactionType);
        }
    : undefined;

  const muteUser: MessageActionType = {
    action: async () => {
      setOverlay('none');
      if (message.user?.id) {
        if (handleMute) {
          handleMute(message);
        }

        await handleToggleMuteUser();
      }
    },
    actionType: 'muteUser',
    icon: <Mute pathFill={grey} />,
    title: isMuted ? t('Unmute User') : t('Mute User'),
  };

  const quotedReply: MessageActionType = {
    action: () => {
      setOverlay('none');
      if (handleQuotedReply) {
        handleQuotedReply(message);
      }
      handleQuotedReplyMessage();
    },
    actionType: 'quotedReply',
    icon: <CurveLineLeftUp pathFill={grey} />,
    title: t('Reply'),
  };

  const retry: MessageActionType = {
    action: async () => {
      setOverlay('none');
      const messageWithoutReservedFields = removeReservedFields(message);
      if (handleRetry) {
        handleRetry(messageWithoutReservedFields);
      }

      await handleResendMessage();
    },
    actionType: 'retry',
    icon: <SendUp pathFill={accent_blue} />,
    title: t('Resend'),
  };

  const threadReply: MessageActionType = {
    action: () => {
      setOverlay('none');
      if (handleThreadReply) {
        handleThreadReply(message);
      }
      onOpenThread();
    },
    actionType: 'threadReply',
    icon: <ThreadReply pathFill={grey} />,
    title: t('Thread Reply'),
  };

  return {
    blockUser,
    copyMessage,
    deleteMessage,
    editMessage,
    flagMessage,
    handleReaction,
    muteUser,
    pinMessage,
    quotedReply,
    retry,
    threadReply,
    unpinMessage,
  };
};
