import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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
import { vw } from '../../utils/utils';

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
   * **Customized MessageList component to used within Thread instead of default MessageList
   * **Available from [MessageList](https://getstream.github.io/stream-chat-react-native/#messagelist)**
   * */
  MessageList?: React.ComponentType<
    MessageListProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Call custom function on closing thread if handling thread state elsewhere
   */
  onThreadDismount?: () => void;
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
    closeThreadOnDismount = true,
    disabled,
    MessageInput = DefaultMessageInput,
    MessageList = DefaultMessageList,
    onThreadDismount,
  } = props;

  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    theme: {
      colors: { background, textGrey },
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
        <DefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
          alignment={'left'}
          groupStyles={['single']}
          message={thread}
          preventPress
          threadList
        />
      </View>
      <View style={[styles.newThread, newThread]}>
        <Svg
          height={newThread.height ?? 24}
          style={{ position: 'absolute' }}
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
                stopColor={backgroundGradientStart || '#F7F7F7'}
                stopOpacity={1}
              />
              <Stop
                offset={0}
                stopColor={backgroundGradientStop || background}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
        </Svg>
        <Text style={[styles.text, { color: textGrey }, text]}>
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
      <MessageList<At, Ch, Co, Ev, Me, Re, Us>
        FooterComponent={footerComponent}
        threadList
        {...additionalMessageListProps}
      />
      <MessageInput<At, Ch, Co, Ev, Me, Re, Us>
        additionalTextInputProps={{ autoFocus, editable: !disabled }}
        {...additionalMessageInputProps}
      />
    </React.Fragment>
  );
};
