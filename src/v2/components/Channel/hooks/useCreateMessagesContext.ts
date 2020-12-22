import { useMemo } from 'react';

import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreateMessagesContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  additionalTouchableProps,
  Attachment,
  AttachmentActions,
  AttachmentFileIcon,
  Card,
  CardCover,
  CardFooter,
  CardHeader,
  DateHeader,
  disableTypingIndicator,
  dismissKeyboardOnMessageTouch,
  FileAttachment,
  FileAttachmentGroup,
  FlatList,
  formatDate,
  Gallery,
  Giphy,
  hasMore,
  InlineUnreadIndicator,
  loadingMore,
  loadingMoreRecent,
  loadMore,
  loadMoreRecent,
  markdownRules,
  Message,
  MessageAvatar,
  MessageContent,
  messageContentOrder,
  MessageFooter,
  MessageHeader,
  MessageList,
  MessageNotification,
  MessageReplies,
  messages,
  MessageSimple,
  MessageStatus,
  MessageSystem,
  MessageText,
  ReactionList,
  reactionsEnabled,
  removeMessage,
  repliesEnabled,
  Reply,
  retrySendMessage,
  setEditingState,
  setReplyToMessageState,
  supportedReactions,
  TypingIndicator,
  TypingIndicatorContainer,
  updateMessage,
  UrlPreview,
}: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const additionalTouchablePropsLength = Object.keys(
    additionalTouchableProps || {},
  ).length;
  const markdownRulesLength = Object.keys(markdownRules || {}).length;
  const messageContentOrderValue = messageContentOrder.join();
  const messagesUpdated = messages
    .map(
      ({ latest_reactions, reply_count, status, updated_at }) =>
        `${
          latest_reactions
            ? latest_reactions.map(({ type }) => type).join()
            : ''
        }${reply_count}${status}${
          updated_at
            ? typeof updated_at === 'string'
              ? updated_at
              : updated_at.toISOString()
            : ''
        }`,
    )
    .join();
  const supportedReactionsLength = supportedReactions.length;

  const messagesContext: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  > = useMemo(
    () => ({
      additionalTouchableProps,
      Attachment,
      AttachmentActions,
      AttachmentFileIcon,
      Card,
      CardCover,
      CardFooter,
      CardHeader,
      DateHeader,
      disableTypingIndicator,
      dismissKeyboardOnMessageTouch,
      FileAttachment,
      FileAttachmentGroup,
      FlatList,
      formatDate,
      Gallery,
      Giphy,
      hasMore,
      InlineUnreadIndicator,
      loadingMore,
      loadingMoreRecent,
      loadMore,
      loadMoreRecent,
      markdownRules,
      Message,
      MessageAvatar,
      MessageContent,
      messageContentOrder,
      MessageFooter,
      MessageHeader,
      MessageList,
      MessageNotification,
      MessageReplies,
      messages,
      MessageSimple,
      MessageStatus,
      MessageSystem,
      MessageText,
      ReactionList,
      reactionsEnabled,
      removeMessage,
      repliesEnabled,
      Reply,
      retrySendMessage,
      setEditingState,
      setReplyToMessageState,
      supportedReactions,
      TypingIndicator,
      TypingIndicatorContainer,
      updateMessage,
      UrlPreview,
    }),
    [
      additionalTouchablePropsLength,
      disableTypingIndicator,
      dismissKeyboardOnMessageTouch,
      hasMore,
      loadingMore,
      markdownRulesLength,
      messageContentOrderValue,
      messagesUpdated,
      supportedReactionsLength,
    ],
  );

  return messagesContext;
};
