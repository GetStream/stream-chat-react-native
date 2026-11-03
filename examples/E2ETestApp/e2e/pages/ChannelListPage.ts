export const ChannelListPage = {
  Tabs: {
    get channels() {
      return by.id('tab-channels');
    },
    get threads() {
      return by.id('tab-threads');
    },
  },

  ThreadList: {
    get screen() {
      return by.id('thread-list-screen');
    },
    get threads() {
      return by.id('thread-list-item');
    },
  },

  /** The channel actions bottom sheet, opened with the "more" swipe action. */
  ChannelActions: {
    item(label: string) {
      return by.text(label);
    },
  },

  ChannelDetails: {
    get pinnedMessagesOption() {
      return by.id('channel-details-pinned-messages');
    },
    get pinnedMessageList() {
      return by.id('pinned-message-list');
    },
    pinnedMessage(text: string) {
      return by.text(text).withAncestor(by.id('pinned-message-list'));
    },
  },

  ChannelList: {
    get channelList() {
      return by.id('channel-list-view');
    },
    get channels() {
      return by.id('channel-preview-button');
    },

    Channel: {
      get avatar() {
        return by.id('avatar-image').withAncestor(by.id('channel-preview-button'));
      },
      get name() {
        return by.id('channel-preview-title');
      },
      nameWithText(text: string) {
        return by.id('channel-preview-title').and(by.text(text));
      },
      get messagePreview() {
        return by.id('channel-preview-message');
      },
      /** "You:" or "<author name>:" in front of the preview text, rendered as its own text. */
      get messageSender() {
        return by.id('channel-preview-sender');
      },
      /** The delivery status icon in front of the current user's last message. */
      deliveryStatus(status: 'sending' | 'sent' | 'delivered' | 'read' | 'none') {
        return by.id(`channel-preview-status-${status}`);
      },
      get anyDeliveryStatus() {
        return by.id(/^channel-preview-status-/);
      },
      get failedMessage() {
        return by.text('Message failed to send').withAncestor(by.id('channel-preview-button'));
      },
      get timestamp() {
        return by.id('channel-preview-timestamp');
      },
      /** The swipe actions behind a channel row: `openSheet` ("more") and `mute`. */
      swipeAction(id: string) {
        return by.id(`swipe-action-${id}`);
      },
      get mutedIcon() {
        return by.id('channel-preview-muted-icon');
      },
      get unreadCount() {
        return by.id('channel-preview-unread-count');
      },
    },
  },
};
