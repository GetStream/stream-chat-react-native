import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  MessageInput as DefaultMessageInput,
  MessageInputProps,
} from '../MessageInput/MessageInput';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { vw } from '../../utils/utils';

import type { MessageListProps } from '../MessageList/MessageList';

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
  absolute: { position: 'absolute' },
  messagePadding: {
    paddingHorizontal: 8,
  },
  newThread: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
  },
  threadHeaderContainer: {
    marginVertical: 8,
  },
});

type ThreadPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'Message' | 'MessageList'
  > &
  Pick<
    ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'closeThread' | 'loadMoreThread' | 'thread'
  > &
  Pick<TranslationContextValue, 't'> & {
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
    /** Closes thread on dismount, defaults to true */
    closeThreadOnDismount?: boolean;
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
     * Call custom function on closing thread if handling thread state elsewhere
     */
    onThreadDismount?: () => void;
  };

const ThreadWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    autoFocus = true,
    channel,
    closeThread,
    closeThreadOnDismount = true,
    disabled,
    loadMoreThread,
    Message,
    MessageInput = DefaultMessageInput,
    MessageList,
    onThreadDismount,
    t,
    thread,
  } = props;

  const {
    theme: {
      colors: { bg_gradient_end, bg_gradient_start, grey },
      thread: {
        newThread: {
          backgroundGradientStart,
          backgroundGradientStop,
          text,
          ...newThread
        },
      },
    },
  } = useTheme();

  useEffect(() => {
    const loadMoreThreadAsync = async () => {
      await loadMoreThread();
    };

    if (thread?.id && thread.reply_count) {
      loadMoreThreadAsync();
    }
  }, []);

  useEffect(
    () => () => {
      if (closeThreadOnDismount) {
        closeThread();
      }
      if (onThreadDismount) {
        onThreadDismount();
      }
    },
    [closeThread, closeThreadOnDismount, onThreadDismount],
  );

  if (!thread) return null;

  const replyCount = thread.reply_count;

  const footerComponent = (
    <View style={styles.threadHeaderContainer}>
      <View style={styles.messagePadding}>
        <Message
          groupStyles={['single']}
          message={thread}
          preventPress
          threadList
        />
      </View>
      <View style={[styles.newThread, newThread]}>
        <Svg
          height={newThread.height ?? 24}
          style={styles.absolute}
          width={vw(100)}
        >
          <Rect
            fill='url(#gradient)'
            height={newThread.height ?? 24}
            width={vw(100)}
            x={0}
            y={0}
          />
          <Defs>
            <LinearGradient
              gradientUnits='userSpaceOnUse'
              id='gradient'
              x1={0}
              x2={0}
              y1={0}
              y2={newThread.height ?? 24}
            >
              <Stop
                offset={1}
                stopColor={backgroundGradientStart || bg_gradient_end}
                stopOpacity={1}
              />
              <Stop
                offset={0}
                stopColor={backgroundGradientStop || bg_gradient_start}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
        </Svg>
        <Text style={[styles.text, { color: grey }, text]}>
          {replyCount === 1
            ? t('1 Reply')
            : t('{{ replyCount }} Replies', {
                replyCount,
              })}
        </Text>
      </View>
    </View>
  );

  return (
    <React.Fragment key={`thread-${thread.id}-${channel?.cid || ''}`}>
      <MessageList
        FooterComponent={footerComponent}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput<At, Ch, Co, Ev, Me, Re, Us>
        additionalTextInputProps={{ autoFocus, editable: !disabled }}
        threadList
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};

export type ThreadProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<ThreadPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * Thread is a consumer of [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalMessageListProps
 * - additionalMessageInputProps
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
  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { Message, MessageList } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { closeThread, loadMoreThread, thread } = useThreadContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  return (
    <ThreadWithContext
      {...{
        channel,
        closeThread,
        loadMoreThread,
        Message,
        MessageList,
        t,
        thread,
      }}
      {...props}
    />
  );
};
