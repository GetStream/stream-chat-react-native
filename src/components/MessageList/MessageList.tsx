import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  ScrollViewProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import {
  DateSeparatorProps,
  DateSeparator as DefaultDateSeparator,
} from './DateSeparator';
import {
  MessageNotification as DefaultMessageNotification,
  MessageNotificationProps,
} from './MessageNotification';
import {
  MessageSystem as DefaultMessageSystem,
  MessageSystemProps,
} from './MessageSystem';
import {
  TypingIndicator as DefaultTypingIndicator,
  TypingIndicatorProps,
} from './TypingIndicator';
import { TypingIndicatorContainer } from './TypingIndicatorContainer';

import { useMessageList } from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';
import { isDateSeparator, MessageOrDate } from './utils/insertDates';

import { Message as DefaultMessage } from '../Message/Message';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  GroupType,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

import type { UserResponse } from 'stream-chat';

import type { FileIconProps } from '../Attachment/FileIcon';
import type { ActionSheetStyles } from '../Message/MessageSimple/MessageActionSheet';
import type { MessageSimpleProps } from '../Message/MessageSimple/MessageSimple';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const ErrorNotification = styled.View`
  align-items: center;
  background-color: #fae6e8;
  color: red;
  padding: 5px;
  z-index: 10;
  ${({ theme }) => theme.messageList.errorNotification.css}
`;

const ErrorNotificationText = styled.Text`
  background-color: #fae6e8;
  color: red;
  ${({ theme }) => theme.messageList.errorNotificationText.css}
`;

const ListContainer = (styled(FlatList)`
  flex: 1;
  padding-horizontal: 10px;
  width: 100%;
  ${({ theme }) => theme.messageList.listContainer.css}
` as React.ComponentType) as new <T>() => FlatList<T>;

const keyExtractor = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  item: MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  if (!isDateSeparator(item)) {
    return (
      item.id ||
      (item.created_at
        ? typeof item.created_at === 'string'
          ? item.created_at
          : item.created_at.toISOString()
        : uuidv4())
    );
  }
  if (item.date && typeof item.date !== 'string') {
    return item.date.toISOString();
  }
  return uuidv4();
};

export type MessageListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Style object for action sheet (used to message actions).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles?: ActionSheetStyles;
  /**
   * Besides existing (default) UX behavior of underlying FlatList of MessageList component, if you want
   * to attach some additional props to underlying FlatList, you can add it to following prop.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
   *
   * e.g.
   * ```js
   * <MessageList
   *  additionalFlatListProps={{ bounces: true, keyboardDismissMode: true }} />
   * ```
   */
  additionalFlatListProps?: Partial<
    FlatListProps<MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /**
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
   */
  DateSeparator?: React.ComponentType<
    DateSeparatorProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  disableWhileEditing?: boolean;
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch?: boolean;
  /**
   * UI component for header of message list. By default message list doesn't have any header.
   * This is basically a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
   * used in MessageList. Its footer instead of header, since message list is inverted.
   *
   */
  FooterComponent?: React.ReactElement;
  HeaderComponent?: React.ReactElement;
  /** Whether or not the FlatList is inverted. Defaults to true */
  inverted?: boolean;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   */
  Message?: React.ComponentType<MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   */
  messageActions?: boolean | string[];
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  /**
   * Custom UI component to display a system message
   * Default component (accepts the same props): [MessageSystem](https://getstream.github.io/stream-chat-react-native/#messagesystem)
   */
  MessageSystem?: React.ComponentType<
    MessageSystemProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  onListScroll?: ScrollViewProps['onScroll'];
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect?: (
    message: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread'],
  ) => void;
  /**
   * Use `setFlatListRef` to get access to ref to inner FlatList.
   *
   * e.g.
   * ```js
   * <MessageList
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef?: (
    ref: FlatList<MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>> | null,
  ) => void;
  /** Whether or not the MessageList is part of a Thread */
  threadList?: boolean;
  /**
   * Typing indicator UI component to render
   *
   * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
   */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
};

/**
 * The message list component renders a list of messages. It consumes the following contexts:
 *
 * [ChannelContext](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * [ChatContext](https://getstream.github.io/stream-chat-react-native/#chatcontext)
 * [MessagesContext](https://getstream.github.io/stream-chat-react-native/#messagescontext)
 * [ThreadContext](https://getstream.github.io/stream-chat-react-native/#threadcontext)
 * [TranslationContext](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 *
 * @example ./MessageList.md
 */
export const MessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    actionSheetStyles,
    additionalFlatListProps,
    AttachmentFileIcon,
    DateSeparator = DefaultDateSeparator,
    disableWhileEditing = true,
    dismissKeyboardOnMessageTouch = true,
    FooterComponent,
    HeaderComponent,
    inverted = true,
    Message: MessageFromProps,
    MessageNotification = DefaultMessageNotification,
    MessageSystem = DefaultMessageSystem,
    messageActions,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    setFlatListRef,
    threadList,
    TypingIndicator = DefaultTypingIndicator,
  } = props;

  const {
    channel,
    disabled,
    EmptyStateIndicator,
    loading,
    LoadingIndicator,
    markRead,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    clearEditingState,
    editing,
    loadMore: mainLoadMore,
    Message: MessageFromContext,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { loadMoreThread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });

  const flatListRef = useRef<FlatList<
    MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const yOffset = useRef(0);

  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList)?.id,
  );
  const [newMessagesNotification, setNewMessageNotification] = useState(false);

  /**
   * In order to prevent the LoadingIndicator component from showing up briefly on mount,
   * we set the loading state one cycle behind to ensure the messages are set before the
   * change to the loading state is registered.
   */
  const [messagesLoading, setMessagesLoading] = useState(false);
  useEffect(() => {
    setMessagesLoading(!!loading);
  }, [loading]);

  useEffect(() => {
    const currentLastMessage = getLastReceivedMessage(messageList);
    if (currentLastMessage) {
      const currentLastReceivedId = currentLastMessage.id;
      if (currentLastReceivedId) {
        const hasNewMessage = lastReceivedId !== currentLastReceivedId;
        const userScrolledUp = yOffset.current > 0;
        const isOwner =
          currentLastMessage &&
          client &&
          currentLastMessage.user?.id === client.userID;

        // always scroll down when it's your own message that you added..
        const scrollToBottom = hasNewMessage && (isOwner || !userScrolledUp);

        // Check the scroll position... if you're scrolled up show a little notification
        if (!scrollToBottom && hasNewMessage && !newMessagesNotification) {
          setNewMessageNotification(true);
        }

        // remove the scroll notification when we scroll down...
        if (scrollToBottom && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0 });
          setNewMessageNotification(false);
        }

        if (hasNewMessage) setLastReceivedId(currentLastReceivedId);
      }
    }
  }, [messageList]);

  const loadMore = threadList ? loadMoreThread : mainLoadMore;

  const Message = MessageFromProps || MessageFromContext;

  const renderItem = (message: MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>) => {
    if (isDateSeparator(message)) {
      return <DateSeparator message={message} />;
    }
    if (message.type === 'system') {
      return <MessageSystem message={message} />;
    }
    if (message.type !== 'message.read') {
      return (
        <DefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
          actionSheetStyles={actionSheetStyles}
          AttachmentFileIcon={AttachmentFileIcon}
          dismissKeyboardOnMessageTouch={dismissKeyboardOnMessageTouch}
          groupStyles={message.groupStyles as GroupType[]}
          lastReceivedId={
            lastReceivedId === message.id ? lastReceivedId : undefined
          }
          Message={Message}
          message={message}
          messageActions={messageActions}
          onThreadSelect={onThreadSelect}
          readBy={(message.readBy as UserResponse<Us>[]) || []}
          threadList={threadList}
        />
      );
    }
    return null;
  };

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const removeNewMessageNotification = y <= 0;
    if (
      !threadList &&
      removeNewMessageNotification &&
      channel &&
      channel.countUnread() > 0
    ) {
      markRead();
    }

    yOffset.current = y;
    if (removeNewMessageNotification) {
      setNewMessageNotification(false);
    }
    if (onListScroll) {
      onListScroll(event);
    }
  };

  const goToNewMessages = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0 });
      setNewMessageNotification(false);
      if (!threadList) markRead();
    }
  };

  // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
  // https://github.com/facebook/react-native/issues/21196
  if (messageList.length === 0 && !threadList) {
    return messagesLoading ? (
      <LoadingIndicator listType='message' />
    ) : (
      <View style={{ flex: 1 }} testID='empty-state'>
        <EmptyStateIndicator listType='message' />
      </View>
    );
  }

  return (
    <>
      <View
        collapsable={false}
        style={{ alignItems: 'center', flex: 1, width: '100%' }}
      >
        <ListContainer
          data={messageList}
          /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
          extraData={disabled}
          inverted={inverted}
          keyboardShouldPersistTaps='always'
          keyExtractor={keyExtractor}
          ListFooterComponent={FooterComponent}
          ListHeaderComponent={HeaderComponent}
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
            minIndexForVisible: 1,
          }}
          onEndReached={loadMore}
          onScroll={handleScroll}
          ref={(fl) => {
            flatListRef.current = fl;
            if (setFlatListRef) {
              setFlatListRef(fl);
            }
          }}
          renderItem={({ item }) => renderItem(item)}
          testID='message-flat-list'
          {...additionalFlatListProps}
        />
        {TypingIndicator && (
          <TypingIndicatorContainer<At, Ch, Co, Ev, Me, Re, Us>>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
        {newMessagesNotification && (
          <MessageNotification
            onPress={goToNewMessages}
            showNotification={newMessagesNotification}
          />
        )}
        {!isOnline && (
          <ErrorNotification testID='error-notification'>
            <ErrorNotificationText>
              {t('Connection failure, reconnecting now ...')}
            </ErrorNotificationText>
          </ErrorNotification>
        )}
      </View>
      {
        // Mask for edit state
        editing && disableWhileEditing && (
          <TouchableOpacity
            onPress={clearEditingState}
            style={{
              backgroundColor: 'black',
              height: '100%',
              opacity: 0.4,
              position: 'absolute',
              width: '100%',
              zIndex: 100,
            }}
          />
        )
      }
    </>
  );
};
