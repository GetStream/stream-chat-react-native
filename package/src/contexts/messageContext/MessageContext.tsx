import React, { PropsWithChildren, useContext } from 'react';

import type { Attachment, LocalMessage, Thread } from 'stream-chat';

import type { ActionHandler } from '../../components/Attachment/Attachment';
import type { MessageActionHandlerCallbacks } from '../../components/Message/hooks/useCreateMessageActionHandlers';
import type { ReactionSummary } from '../../components/Message/hooks/useProcessReactions';
import type {
  MessagePressableHandlerPayload,
  PressableHandlerPayload,
} from '../../components/Message/Message';
import { DEFAULT_MESSAGE_OVERLAY_TARGET_ID } from '../../components/Message/messageOverlayConstants';
import type { GroupType } from '../../components/MessageList/hooks/useMessageList';
import type { ChannelContextValue } from '../../contexts/channelContext/ChannelContext';
import type { MessageContentType } from '../../contexts/messagesContext/MessagesContext';
import type { DeepPartial } from '../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../contexts/themeContext/utils/theme';
import type { Rect } from '../../state-store/message-overlay-store';
import type { ViewRef } from '../../types/react-native-compat';

import type { MessageComposerAPIContextValue } from '../messageComposerContext/MessageComposerAPIContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type Alignment = 'right' | 'left';

export type MessageContextValue = {
  /** True for a received regular message, the only kind that can be acted on. */
  actionsEnabled: boolean;
  /** Side of the list the message is aligned to. */
  alignment: Alignment;
  /** Closes the message overlay. */
  dismissOverlay: () => void;
  /** The file attachments of the message. */
  files: Attachment[];
  /**
   * Position of the message in its group of consecutive messages from the same user: `top`,
   * `bottom`, `middle` or `single`. For example, the avatar shows on the bottom message only.
   */
  groupStyles: GroupType[];
  /** Handler for attachment actions, such as those of command responses. */
  handleAction: ActionHandler;
  /** Whether any attachment of the message exposes actions. */
  hasAttachmentActions: boolean;
  handleToggleReaction: (reactionType: string) => Promise<void>;
  /**
   * The handlers behind this message's actions (copy, delete, edit, pin, mute, ...). Built once per
   * message and shared by everything that acts on it, including the action menu, so a handler keeps
   * working after the menu that invoked it has closed. Read it with `useMessageActionHandlers()`.
   */
  messageActionHandlers: MessageActionHandlerCallbacks;
  /**
   * Whether the message renders interactive children (poll options, attachments, the quoted-reply
   * navigator, shared location), so the row drops its single focus stop and VoiceOver/TalkBack can
   * reach them. Resolved from `AccessibilityContext.hasInteractiveAccessibilityContent`.
   */
  hasInteractiveAccessibilityContent: boolean;
  /** Whether the message has reactions. */
  hasReactions: boolean;
  /** Whether the message has no text, no quoted message and exactly one attachment. */
  messageHasOnlySingleAttachment: boolean;
  /** The image attachments of the message. */
  images: Attachment[];
  /** Whether the message was sent by the current user. */
  isMyMessage: boolean;
  /** Whether this is the newest message in its list, with nothing newer loaded below it. */
  isVeryLastMessage?: boolean;
  /** Whether this is the last message of its group (`bottom` or `single`). */
  lastGroupMessage: boolean;
  message: LocalMessage;
  /**
   * Ref to the view the message context menu aligns with. Custom message renderers can attach it
   * to a different subview.
   */
  contextMenuAnchorRef: React.RefObject<ViewRef | null>;
  /**
   * Stable ID of this rendered message instance, so two renderings of the same message do not
   * collide in the overlay state.
   */
  messageOverlayId: string;
  /** Order in which the message content is rendered. */
  messageContentOrder: MessageContentType[];
  /**
   * Long-press handler. Defaults to opening the message overlay, except for blocked messages,
   * messages with attachment actions, or when `enableLongPress` is false.
   *
   * @param payload Payload of the long-press event.
   */
  onLongPress: (payload: PressableHandlerPayload) => void;
  /** Whether the message is only text and the text is only emojis. */
  onlyEmojis: boolean;
  /** Opens the thread of the message. */
  onOpenThread: () => void;
  /**
   * Press handler. Defaults to dismissing the keyboard when `dismissKeyboardOnMessageTouch` is on,
   * and to opening the message overlay or bounce dialog for a failed or errored message.
   *
   * @param payload Payload of the press event.
   */
  onPress: (payload: MessagePressableHandlerPayload) => void;
  onPressIn: ((payload: PressableHandlerPayload) => void) | null;
  /** The attachments that are not files, images or videos. */
  otherAttachments: Attachment[];
  /**
   * Registers the view to measure and portal into the message overlay. Custom message renderers
   * use it through `MessageOverlayWrapper`.
   */
  registerMessageOverlayTarget: (params: { id: string; view: ViewRef | null }) => void;
  unregisterMessageOverlayTarget: (id: string) => void;
  reactions: ReactionSummary[];
  /** Opens the message overlay with all the message actions. */
  showMessageOverlay: () => void;
  showReactionsOverlay: (selectedReaction?: string) => void;
  showMessageStatus: boolean;
  /** The video attachments of the message. */
  videos: Attachment[];
  goToMessage?: (messageId: string) => void;
  /**
   * Handles a reaction on the message.
   *
   * @param reactionType The type of the reaction.
   */
  handleReaction?: (reactionType: string) => Promise<void>;
  /** Theme applied only to messages of the current user. */
  myMessageTheme?: DeepPartial<Theme>;
  /** Disables pressing the message attachments. Always true while the message overlay is active. */
  preventPress?: boolean;
  /** Whether the avatar shows next to the message. */
  showAvatar?: boolean;
  /**
   * Selects the thread of the message.
   *
   * @param thread The thread of the message.
   */
  onThreadSelect?: (thread: Thread) => void;
} & Pick<ChannelContextValue, 'channel'> &
  Pick<MessageComposerAPIContextValue, 'setQuotedMessage'>;

export const MessageContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageContextValue,
);

export const MessageProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageContextValue;
}>) => (
  <MessageContext.Provider value={value as unknown as MessageContextValue}>
    {children}
  </MessageContext.Provider>
);

export const useMessageContext = () => {
  const contextValue = useContext(MessageContext) as unknown as MessageContextValue;

  return contextValue;
};

type MessageOverlayRuntimeContextValue = {
  overlayTargetRectRef: { current: Rect };
  messageOverlayTargetId: string;
  overlayActive: boolean;
};

const MessageOverlayRuntimeContext = React.createContext<MessageOverlayRuntimeContextValue>({
  overlayTargetRectRef: { current: undefined },
  messageOverlayTargetId: DEFAULT_MESSAGE_OVERLAY_TARGET_ID,
  overlayActive: false,
});

export const MessageOverlayRuntimeProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: MessageOverlayRuntimeContextValue }>) => (
  <MessageOverlayRuntimeContext.Provider value={value}>
    {children}
  </MessageOverlayRuntimeContext.Provider>
);

export const useMessageOverlayRuntimeContext = () => useContext(MessageOverlayRuntimeContext);

const MessageOverlayTargetContext = React.createContext(false);

export const MessageOverlayTargetProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: boolean }>) => (
  <MessageOverlayTargetContext.Provider value={value}>
    {children}
  </MessageOverlayTargetContext.Provider>
);

export const useMessageOverlayTargetContext = () => useContext(MessageOverlayTargetContext);
