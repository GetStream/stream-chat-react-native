const messageCell = () => by.id(/^message-list-item-/);
// Fabric mounts `message-list-item-*` empty with its content beside it, so the list, not the cell,
// is the ancestor that scopes message elements (the channel list stays mounted underneath).
const inMessageList = (matcher: Detox.NativeMatcher) =>
  matcher.withAncestor(by.id(/^message-(flat|flash)-list$/));

export const MessageListPage = {
  Header: {
    get backButton() {
      return by.id('back-button');
    },
  },

  Composer: {
    get inputField() {
      return by.id('auto-complete-text-input');
    },
    get sendButton() {
      return by.id('send-button');
    },
    get attachmentsButton() {
      return by.id('attach-button');
    },
    get cooldownIndicator() {
      return by.id('cooldown-timer');
    },
  },

  MessageList: {
    get messageList() {
      return by.id(/^message-(flat|flash)-list$/);
    },
    get messages() {
      return messageCell();
    },
    get dateSeparator() {
      return by.id('date-separator');
    },
    get typingIndicator() {
      return by.id('typing-indicator');
    },
    get scrollToBottomButton() {
      return by.id('scroll-to-bottom-button');
    },

    Message: {
      /** Wraps the author's avatar; only rendered for other users' messages. */
      get avatar() {
        return by.id('message-author');
      },
      text(text: string) {
        // Not under `message-text-container`: Fabric mounts that view empty, with the text beside it.
        return by.text(text).withAncestor(by.id('message-content-wrapper'));
      },
      get timestamp() {
        return by.id('message-status-time');
      },
      get deliveryStatusIsRead() {
        return inMessageList(by.id('message-status-read'));
      },
      get deliveryStatusIsDelivered() {
        return inMessageList(by.id('message-status-delivered'));
      },
      get deliveryStatusIsPending() {
        return inMessageList(by.id('message-status-sending'));
      },
      get deliveryStatusIsSent() {
        return inMessageList(by.id('message-status-sent'));
      },
      get deliveryStatusIsFailed() {
        return inMessageList(by.id('message-error'));
      },
      get deletedMessage() {
        return by.id('message-deleted');
      },
      get threadRepliesLabel() {
        return by.id('message-replies');
      },

      Reactions: {
        get reactions() {
          return by.id('reaction-list-item');
        },
      },
    },
  },
};
