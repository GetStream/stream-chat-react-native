export const ChannelListPage = {
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
      get unreadCount() {
        return by.id('unread-count').withAncestor(by.id('channel-preview-button'));
      },
    },
  },
};
