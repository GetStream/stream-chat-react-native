import React, { PropsWithChildren, useContext } from 'react';

import { PressableProps, ViewProps } from 'react-native';

import type { Attachment, Channel, LocalMessage } from 'stream-chat';

import type { MessagePressableHandlerPayload } from '../../components/Message/Message';
import type { MarkdownRules } from '../../components/Message/MessageItemView/utils/renderText';
import type { MessageActionsParams } from '../../components/Message/utils/messageActions';
import type {
  GroupStyle,
  MessageGroupStylesParams,
} from '../../components/MessageList/utils/getGroupStyles';
import type { MessageActionType } from '../../components/MessageMenu/MessageActionListItem';
import { NativeHandlers } from '../../native';

import type { ReactionData } from '../../utils/utils';
import type { Alignment } from '../messageContext/MessageContext';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';
import type { AlsoSentToChannelHeaderPressPayload } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageContentType =
  | 'attachments'
  | 'files'
  | 'gallery'
  | 'quoted_reply'
  | 'poll'
  | 'ai_text'
  | 'text'
  | 'location';

export type MessageLocationProps = {
  message: LocalMessage;
};

export type MessagesContextValue = {
  /** Whether touching a message dismisses the keyboard. */
  dismissKeyboardOnMessageTouch: boolean;

  enableMessageGroupingByUser: boolean;

  /** The type of URL preview to render. Defaults to 'full'. */
  urlPreviewType: 'compact' | 'full';

  FlatList: typeof NativeHandlers.FlatList | undefined;
  /**
   * The Giphy image version to render, one of the keys of the Giphy
   * [Image Object](https://developers.giphy.com/docs/api/schema#image-object).
   * Defaults to 'fixed_height'.
   */
  giphyVersion: keyof NonNullable<Attachment['giphy']>;

  /** Order in which the message content types are rendered. */
  messageContentOrder: MessageContentType[];
  /**
   * Overlay target ID to teleport when a message overlay opens. A custom `MessageOverlayWrapper`
   * needs a matching `targetId`.
   */
  messageOverlayTargetId?: string;
  /**
   * Extra props for the `Pressable` that wraps the inner `MessageContent`, except `style`.
   *
   * @overrideType Object
   */
  additionalPressableProps?: Omit<PressableProps, 'style'>;

  /** Overrides the swipe action on a message, which quotes the message by default. */
  customMessageSwipeAction?: ({
    channel,
    message,
  }: {
    channel: Channel;
    message: LocalMessage;
  }) => void;

  disableTypingIndicator?: boolean;
  /** Whether swiping a message replies to it. Defaults to true. */
  enableSwipeToReply?: boolean;
  /**
   * Forces every message to the 'left' or 'right' side of the screen. By default, received messages
   * are on the left and sent messages on the right.
   */
  forceAlignMessages?: Alignment | boolean;

  getMessageGroupStyle?: (params: MessageGroupStylesParams) => GroupStyle[];
  /**
   * Called when the ban user action runs, before the default action.
   * @param message
   */
  handleBan?: (message: LocalMessage) => Promise<void>;
  /** Called when the copy message action runs, before the default action. */
  handleCopy?: (message: LocalMessage) => Promise<void>;
  /** Called when the delete for me action runs, before the default action. */
  handleDeleteForMe?: (message: LocalMessage) => Promise<void>;
  /** Called when the delete message action runs, before the default action. */
  handleDelete?: (message: LocalMessage) => Promise<void>;
  /** Called when the edit message action runs, before the default action. */
  handleEdit?: (message: LocalMessage) => void;
  /** Called when the flag message action runs, before the default action. */
  handleFlag?: (message: LocalMessage) => Promise<void>;
  /** Called when the mark unread action runs, before the default action. */
  handleMarkUnread?: (message: LocalMessage) => Promise<void>;
  /** Called when the mute user action runs, before the default action. */
  handleMute?: (message: LocalMessage) => Promise<void>;
  /** Called when the pin/unpin action runs, before the default action. */
  handlePinMessage?: ((message: LocalMessage) => MessageActionType) | null;
  /** Called when the quoted reply action runs, before the default action. */
  handleQuotedReply?: (message: LocalMessage) => Promise<void>;
  /** Called when a reaction is toggled, before the default action. */
  handleReaction?: (message: LocalMessage, reactionType: string) => Promise<void>;
  /** Called when the retry action runs, with the message stripped of reserved fields. */
  handleRetry?: (message: LocalMessage) => Promise<void>;
  /** Called when the thread reply action runs, before the default action. */
  handleThreadReply?: (message: LocalMessage) => Promise<void>;
  /** Called when the block user action runs, before the default action. */
  handleBlockUser?: (user: LocalMessage['user']) => Promise<void>;
  /** Whether the poll creation button is available. Also requires polls enabled on the channel. */
  hasCreatePoll?: boolean;
  /** Custom memoization check for an attachment: returns whether the two are equal. */
  isAttachmentEqual?: (prevAttachment: Attachment, nextAttachment: Attachment) => boolean;
  /**
   * Custom rules for the markdown renderer, as defined by simple-markdown:
   * https://github.com/Khan/simple-markdown#adding-a-simple-extension
   */
  markdownRules?: MarkdownRules;
  /**
   * Overrides the message actions shown in the message overlay. Receives the default actions and
   * returns the ones to show, in order. For example, to keep only two of them:
   *
   * ```
   * <Channel messageActions={({ copyMessage, threadReply }) => [threadReply, copyMessage]} />
   * ```
   *
   * @overrideType Function | Array<Objects>
   */
  messageActions?: (param: MessageActionsParams) => MessageActionType[];

  /** Hit slop of the swipe to reply gesture. */
  messageSwipeToReplyHitSlop?: ViewProps['hitSlop'];
  /** Maximum number of lines of message text to display. Only the first paragraph is rendered. */
  messageTextNumberOfLines?: number;
  /** Theme applied only to the messages of the current user. */
  myMessageTheme?: DeepPartial<Theme>;
  /**
   * Overrides the long press handler of a message, which opens the message overlay by default. The
   * payload carries `actionHandlers`, `defaultHandler`, `emitter`, `event` and `message`.
   */
  onLongPressMessage?: (payload: MessagePressableHandlerPayload) => void;
  /** Called when a press on a message or its content starts. Takes the same payload. */
  onPressInMessage?: (payload: MessagePressableHandlerPayload) => void;
  /**
   * Overrides the press handler of a message. Takes the same payload as `onLongPressMessage`.
   *
   * Pressing a reaction opens the reactions bottom sheet by default. To toggle the reaction
   * instead, intercept the `reactionList` emitter:
   *
   * ```
   * <Channel
   *  onPressMessage={({ emitter, additionalInfo, actionHandlers, defaultHandler }) => {
   *    if (emitter === 'reactionList' && additionalInfo?.reactionType) {
   *      actionHandlers?.toggleReaction(additionalInfo.reactionType as string);
   *      return;
   *    }
   *    defaultHandler?.();
   *  }}
   * />
   * ```
   */
  onPressMessage?: (payload: MessagePressableHandlerPayload) => void;
  /**
   * Handles a press on the "View" action of the "Also sent in channel" / "Replied to a thread"
   * header. The action is only shown when this is set. The payload carries the targeted message ID,
   * and in a channel also the reply's thread.
   */
  onAlsoSentToChannelHeaderPress?: (payload: AlsoSentToChannelHeaderPressPayload) => void;
  /** Where the reaction list renders in the message. Defaults to 'top'. */
  reactionListPosition?: 'top' | 'bottom';

  /** The layout of the reaction list. Defaults to 'clustered'. */
  reactionListType?: 'clustered' | 'segmented';

  /**
   * Overrides the reaction handler of the message and the message overlay: takes the message and
   * returns the function that receives the reaction type.
   */
  selectReaction?: (message: LocalMessage) => (reactionType: string) => Promise<void>;

  /** Whether messages get an underlay when the list has unread ones. Defaults to true. */
  shouldShowUnreadUnderlay?: boolean;
  /** The reactions users can react to messages with. */
  supportedReactions?: ReactionData[];
};

export const MessagesContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessagesContextValue,
);

export const MessagesProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: MessagesContextValue;
}>) => (
  <MessagesContext.Provider value={value as unknown as MessagesContextValue}>
    {children}
  </MessagesContext.Provider>
);

export const useMessagesContext = () => {
  const contextValue = useContext(MessagesContext) as unknown as MessagesContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessagesContext hook was called outside of the MessagesContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    );
  }

  return contextValue;
};
