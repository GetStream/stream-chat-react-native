import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  View,
} from 'react-native';
import uuidv4 from 'uuid/v4';

import type { UserResponse } from 'stream-chat';

import DefaultDateSeparator, { DateSeparatorProps } from './DateSeparator';
import MessageNotification from './MessageNotification';
import DefaultMessageSystem, { MessageSystemProps } from './MessageSystem';
import DefaultTypingIndicator, {
  TypingIndicatorProps,
} from './TypingIndicator';
import TypingIndicatorContainer from './TypingIndicatorContainer';

import { useMessageList } from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';
import { InsertDate, isDateSeparator } from './utils/insertDates';

import DefaultMessage from '../Message/Message';

import type { FileIconProps } from '../Attachment/FileIcon';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  GroupType,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const ListContainer = (styled(FlatList)`
  flex: 1;
  padding-horizontal: 10px;
  width: 100%;
  ${({ theme }) => theme.messageList.listContainer.css}
` as React.ComponentType) as new <T>() => FlatList<T>;

const ErrorNotificationText = styled.Text`
  background-color: #fae6e8;
  color: red;
  ${({ theme }) => theme.messageList.errorNotificationText.css}
`;

const ErrorNotification = styled.View`
  align-items: center;
  background-color: #fae6e8;
  color: red;
  padding: 5px;
  z-index: 10;
  ${({ theme }) => theme.messageList.errorNotification.css}
`;

export type MessageListProps<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  /**
   * Style object for action sheet (used to message actions).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles?: { [key: string]: unknown };
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
  additionalFlatListProps?: FlatListProps<
    InsertDate<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon?: React.ComponentType<Partial<FileIconProps>>;
  /**
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
   */
  DateSeparator?: React.ComponentType<
    DateSeparatorProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  disableWhileEditing?: boolean;
  /**
   * UI component for header of message list. By default message list doesn't have any header.
   * This is basically a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
   * used in MessageList. Its footer instead of header, since message list is inverted.
   *
   */
  HeaderComponent?: React.ComponentType;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   */
  Message?: React.ComponentType<Partial<unknown>>; // TODO: type with Message props
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   */
  messageActions?: boolean | ('delete' | 'edit' | 'reactions' | 'reply')[];
  /**
   * Custom UI component to display a system message
   * Default component (accepts the same props): [MessageSystem](https://getstream.github.io/stream-chat-react-native/#messagesystem)
   */
  MessageSystem?: React.ComponentType<
    MessageSystemProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect?: (message: unknown) => void;
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
    ref: FlatList<InsertDate<At, Ch, Co, Ev, Me, Re, Us>> | null,
  ) => void;
  /** Whether or not the MessageList is part of a Thread */
  threadList?: boolean;
  /**
   * Typing indicator UI component to render
   *
   * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
   */
  TypingIndicator?: React.ComponentType<Partial<TypingIndicatorProps>>;
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
const MessageList = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>({
  actionSheetStyles,
  additionalFlatListProps,
  AttachmentFileIcon,
  DateSeparator = DefaultDateSeparator,
  disableWhileEditing = true,
  HeaderComponent,
  Message: MessageFromProps,
  MessageSystem = DefaultMessageSystem,
  messageActions,
  noGroupByUser,
  onThreadSelect,
  setFlatListRef,
  threadList,
  TypingIndicator = DefaultTypingIndicator,
}: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const {
    channel,
    disabled,
    EmptyStateIndicator,
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

  const Message = MessageFromProps || MessageFromContext;
  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    noGroupByUser,
    threadList,
  });

  const flatListRef = useRef<FlatList<
    InsertDate<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const yOffset = useRef(0);

  const [lastReceivedId, setLastReceivedId] = useState(() => {
    let message;
    if (getLastReceivedMessage) {
      message = getLastReceivedMessage<At, Ch, Co, Ev, Me, Re, Us>(messageList);
    }
    return !message || isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(message)
      ? undefined
      : message.id;
  });
  const [newMessagesNotification, setNewMessageNotification] = useState(false);

  useEffect(() => {
    const currentLastMessage = getLastReceivedMessage<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >(messageList);
    if (
      currentLastMessage &&
      !isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(currentLastMessage)
    ) {
      const currentLastReceivedId = currentLastMessage.id;
      if (currentLastReceivedId) {
        const hasNewMessage = lastReceivedId !== currentLastReceivedId;
        const userScrolledUp = yOffset.current > 0;
        const isOwner = currentLastMessage?.user?.id === client.userID;

        // always scroll down when it's your own message that you added..
        const scrollToBottom =
          (hasNewMessage && isOwner) || (hasNewMessage && !userScrolledUp);

        // Check the scroll position... if you're scrolled up show a little notification
        if (!scrollToBottom && hasNewMessage && !newMessagesNotification) {
          setNewMessageNotification(true);
        }
        if (scrollToBottom) {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: 0 });
          }
        }

        // remove the scroll notification if we already scrolled down...
        if (scrollToBottom && newMessagesNotification) {
          setNewMessageNotification(false);
        }
        if (hasNewMessage) setLastReceivedId(currentLastReceivedId);
      }
    }
  }, [messageList]);

  const loadMore = threadList ? loadMoreThread : mainLoadMore;

  const renderItem = (message: InsertDate<At, Ch, Co, Ev, Me, Re, Us>) => {
    if (isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(message)) {
      return <DateSeparator message={message} />;
    } else if (message.type === 'system') {
      return <MessageSystem message={message} />;
    } else if (message.type !== 'message.read') {
      return (
        <DefaultMessage
          actionSheetStyles={actionSheetStyles}
          AttachmentFileIcon={AttachmentFileIcon}
          groupStyles={message.groupStyles as GroupType[]}
          lastReceivedId={lastReceivedId === message.id ? lastReceivedId : null}
          Message={Message}
          message={message}
          messageActions={messageActions}
          onThreadSelect={onThreadSelect}
          readBy={(message.readBy as UserResponse<Us>[]) || []}
          threadList={threadList}
        />
      );
    }
    return <></>;
  };

  const handleScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => void = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const removeNewMessageNotification = y <= 0;
    if (
      !threadList &&
      removeNewMessageNotification &&
      channel &&
      channel.countUnread() > 0
    )
      markRead();

    yOffset.current = y;
    if (removeNewMessageNotification) {
      setNewMessageNotification(false);
    }
  };

  const goToNewMessages = () => {
    setNewMessageNotification(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0 });
    }
    if (!threadList) markRead();
  };

  // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
  // https://github.com/facebook/react-native/issues/21196
  if (messageList && messageList.length === 0 && !threadList) {
    return (
      <View style={{ flex: 1 }}>
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
          inverted
          keyboardShouldPersistTaps='always'
          keyExtractor={(item) => {
            if (!isDateSeparator(item)) {
              return (
                item.id ||
                (item.created_at
                  ? typeof item.created_at === 'string'
                    ? item.created_at
                    : item.created_at.toISOString()
                  : '')
              );
            } else if (item.date && typeof item.date !== 'string') {
              return item.date.toISOString();
            }
            return uuidv4();
          }}
          ListFooterComponent={HeaderComponent}
          // @ts-ignore update @types/react-native in deps when https://github.com/DefinitelyTyped/DefinitelyTyped/pull/48114 is merged and published
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
            minIndexForVisible: 1,
          }}
          onEndReached={loadMore}
          onScroll={handleScroll}
          ref={(fl) => {
            flatListRef.current = fl;
            setFlatListRef && setFlatListRef(fl);
          }}
          renderItem={({ item }) => renderItem(item)}
          testID='message-flat-list'
          {...(additionalFlatListProps || {})}
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

export default MessageList;
