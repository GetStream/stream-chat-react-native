import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Message as DefaultMessage } from '../Message/Message';
import {
  MessageInput as DefaultMessageInput,
  MessageInputProps,
} from '../MessageInput/MessageInput';
import {
  MessageList as DefaultMessageList,
  MessageListProps,
} from '../MessageList/MessageList';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import type { Message as StreamMessage } from 'stream-chat';

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

const styles = StyleSheet.create({
  newThread: {
    alignItems: 'center',
    backgroundColor: '#F4F9FF',
    borderRadius: 4,
    margin: 10,
    padding: 8,
  },
});

export type ThreadProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react-native/#messageinput
   * */
  additionalMessageInputProps?: Partial<
    MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react-native/#messagelist
   * */
  additionalMessageListProps?: Partial<
    MessageListProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
  /** Disables the thread UI. So MessageInput and MessageList will be disabled. */
  disabled?: boolean;
  /**
   * **Customized MessageInput component to used within Thread instead of default MessageInput
   * **Available from [MessageInput](https://getstream.github.io/stream-chat-react-native/#messageinput)**
   */
  MessageInput?: React.ComponentType<
    MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * **Customized MessageList component to used within Thread instead of default MessageList
   * **Available from [MessageList](https://getstream.github.io/stream-chat-react-native/#messagelist)**
   * */
  MessageList?: React.ComponentType<
    MessageListProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
};

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * Thread is a consumer of [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ./Thread.md
 */
export const Thread = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    autoFocus = true,
    disabled,
    MessageInput = DefaultMessageInput,
    MessageList = DefaultMessageList,
  } = props;

  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    theme: {
      thread: {
        newThread: { text, ...newThread },
      },
    },
  } = useTheme();
  const { loadMoreThread, thread } = useThreadContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  useEffect(() => {
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    if (thread?.id && thread.reply_count) {
      loadMoreThreadAsync();
    }
  }, []);

  if (!thread) return null;

  const headerComponent = (
    <>
      <DefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
        alignment={'left'}
        enableLongPress={false}
        groupStyles={['single']}
        message={thread}
        threadList
      />
      <View style={[styles.newThread, newThread]}>
        <Text style={text}>{t('Start of a new thread')}</Text>
      </View>
    </>
  );

  return (
    <React.Fragment key={`thread-${thread.id}-${channel?.cid || ''}`}>
      <MessageList<At, Ch, Co, Ev, Me, Re, Us>
        HeaderComponent={headerComponent}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput<At, Ch, Co, Ev, Me, Re, Us>
        additionalTextInputProps={{ autoFocus, editable: !disabled }}
        parent_id={thread.id as StreamMessage<At, Me, Us>['parent_id']}
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};

Thread.displayName = 'Thread{thread{newThread}}';
