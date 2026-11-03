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
    /** The mentions and commands suggestions both render in this list above the composer. */
    get suggestionList() {
      return by.id('auto-complete-suggestion-list');
    },
    get userSuggestion() {
      return by.id('mentions-item-name');
    },
    userSuggestionWithName(name: string) {
      return by.id('mentions-item-name').and(by.text(name));
    },
    get commandSuggestion() {
      return by.id('commands-item-title');
    },
    commandSuggestionWithName(name: string) {
      return by.id('commands-item-title').and(by.text(name));
    },
    get commandsHeader() {
      return by.id('commands-header-title');
    },
    get linkPreview() {
      return by.id('composer-link-preview');
    },
    get mediaAttachmentPreview() {
      return by.id('image-attachment-upload-preview');
    },
    get fileAttachmentPreview() {
      return by.id('file-attachment-upload-preview');
    },
    get linkPreviewCancelButton() {
      return by.id('composer-link-preview-dismiss');
    },
    /** "Also send to channel", shown in a thread's composer. */
    get alsoSendToChannelCheckbox() {
      return by.id('show-thread-message-in-channel-button');
    },
  },

  AttachmentPicker: {
    /** Gallery images not picked yet (labelled while the app's accessibility layer is on). */
    get images() {
      return by.label('Select image');
    },
  },

  CreatePoll: {
    /**
     * The text fields of the create poll sheet: the question first, then one per option (a new empty
     * one follows each filled option). Their placeholders are hints on Android, which `by.text`
     * doesn't match.
     */
    get fields() {
      return device.getPlatform() === 'android'
        ? by.type('com.facebook.react.views.textinput.ReactEditText')
        : by.type('RCTUITextField');
    },
    get multipleVotesSwitch() {
      return device.getPlatform() === 'android'
        ? by.type('com.facebook.react.views.switchview.ReactSwitch')
        : by.type('UISwitch');
    },
    get createButton() {
      return by.label('Create poll');
    },
  },

  ContextMenu: {
    /** An action of the message menu, by its `actionType` (`deleteMessage`, `threadReply`, …). */
    action(actionType: string) {
      return by.id(`message-action-${actionType}`);
    },
    get backdrop() {
      return by.id('message-overlay-backdrop');
    },
    /** A reaction of the menu's reaction picker. */
    reaction(type: string) {
      return by.id(`reaction-button-${type}`);
    },
    get showMoreReactions() {
      return by.id('more-reactions-button');
    },
    /** An emoji in the extended reactions picker. */
    emoji(emoji: string) {
      return by.text(emoji);
    },
  },

  /** The native confirmation dialogs (`Alert.alert`). */
  Alert: {
    button(text: string) {
      return device.getPlatform() === 'android'
        ? by.text(text).and(by.type('android.widget.Button'))
        : by.label(text).and(by.traits(['button']));
    },
  },

  ThreadPage: {
    /** "N Replies" between the thread's parent message and its replies. */
    get repliesCountLabel() {
      return by.id('thread-footer-component');
    },
  },

  MessageList: {
    get messageList() {
      return by.id(/^message-(flat|flash)-list$/);
    },
    /**
     * What swipes target: the inverted FlatList's own transform throws off Detox's gesture
     * coordinates on Android (a vertical swipe lands as a horizontal one).
     */
    get scrollTarget() {
      return by.id('message-flat-list-wrapper');
    },
    get messages() {
      return messageCell();
    },
    /**
     * Every rendered message bubble, deleted ones included. Carries the message text as its label,
     * so it is also how the robots find "the n-th message from the bottom".
     */
    get messageContents() {
      return inMessageList(by.id(/^message-(content-wrapper|deleted)$/));
    },
    get dateSeparator() {
      return by.id('date-separator');
    },
    get typingIndicator() {
      return by.id('typing-indicator');
    },
    /** The "N new messages" separator above the first unread message. */
    get unreadSeparator() {
      return by.id('inline-unread-indicator');
    },
    /** The "N unread" banner at the top that jumps to the first unread message. */
    get scrollToFirstUnreadButton() {
      return by.id('unread-messages-notification-button');
    },
    get scrollToFirstUnreadDismissButton() {
      return by.id('unread-messages-notification-dismiss-button');
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
        return inMessageList(by.id('message-status-time'));
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
        return inMessageList(by.id('message-deleted'));
      },
      get editedLabel() {
        return inMessageList(by.text('Edited'));
      },
      get threadRepliesLabel() {
        return inMessageList(by.id('message-replies'));
      },
      /** The header of a thread reply that was also sent to the channel, in the channel. */
      get repliedToThreadLabel() {
        return inMessageList(by.text('Replied to a thread'));
      },
      /** The header of a thread reply that was also sent to the channel, in the thread. */
      get alsoSentInChannelLabel() {
        return inMessageList(by.text('Also sent in channel'));
      },

      pinnedLabel(name: string) {
        return inMessageList(by.text(`Pinned by ${name}`));
      },
      Poll: {
        question(text: string) {
          return inMessageList(by.text(text));
        },
        get singleVoteSubtitle() {
          return inMessageList(by.text('Select one'));
        },
        get closedSubtitle() {
          return inMessageList(by.text('Poll has ended'));
        },
        option(text: string) {
          return inMessageList(by.text(text));
        },
        /** The vote button of `option` (labelled with its text); `checked` once the user voted. */
        voteButton(option: string, checked?: boolean) {
          const id =
            checked === undefined
              ? /^poll-vote-button(-checked)?$/
              : checked
                ? 'poll-vote-button-checked'
                : 'poll-vote-button';
          return by.id(id).and(by.label(option));
        },
        voteCount(count: number) {
          return inMessageList(by.label(count === 1 ? '1 vote' : `${count} votes`));
        },
        get viewResultsButton() {
          return by.text('View Results');
        },
        get endPollButton() {
          return by.text('End Vote');
        },
        get resultsTitle() {
          return by.text('Poll Results');
        },
      },
      /** The quote inside a quoted reply. */
      get quotedMessage() {
        return inMessageList(by.id('quoted-message'));
      },
      quotedMessageWithText(text: string) {
        return by.text(text).withAncestor(by.id('quoted-message'));
      },
      /** A link preview (OG card) under a message. */
      get linkPreview() {
        return inMessageList(by.id('card-attachment'));
      },
      /** An image or video of a message's gallery. */
      get galleryItem() {
        return inMessageList(by.id(/^gallery-(row|column)-\d+-item-\d+$/));
      },
      get gallery() {
        return inMessageList(by.id('gallery-container'));
      },
      get file() {
        return inMessageList(by.id('file-attachment'));
      },
      /** A sent giphy, or the ephemeral preview (with Send / Shuffle / Cancel) before it is sent. */
      get giphy() {
        return inMessageList(by.id(/^giphy-(action-)?attachment$/));
      },
      GiphyButtons: {
        get send() {
          return by.id('send-action-button');
        },
        get shuffle() {
          return by.id('shuffle-action-button');
        },
        get cancel() {
          return by.id('cancel-action-button');
        },
      },

      Reactions: {
        /** The reactions under a message (clustered: one row for all types). */
        get reactions() {
          return inMessageList(by.id(/^reaction-list-item-/));
        },
        reaction(type: string) {
          return inMessageList(by.id(`reaction-list-item-${type}`));
        },
      },
    },
  },
};
