// Localized String Keys
import LocalizedStrings from 'localized-strings';

export const LSK_AUTO_COMPLETE_INPUT_PLACEHOLDER =
  'auto-complete-input-placeholder';
export const LSK_NO_CHANNEL_SELECTED_MESSAGE = 'no-channel-selected-message';
export const LSK_CHANNEL_MISSING_MESSAGE = 'channel-missing-message';
export const LSK_SINGLE_USER_TYPING = 'single-user-typing';
export const LSK_TWO_USERS_TYPING = 'two-users-typing';
export const LSK_MULTIPLE_USERS_TYPING = 'multiple-users-typing';
export const LSK_CHANNEL_PREVIEW_NO_MESSAGE = 'channel-preview-no-message';
export const LSK_CHANNEL_PREVIEW_MESSAGE_DELETED =
  'channel-preview-message-deleted';
export const LSK_CHANNEL_PREVIEW_ATTACHMENT = 'channel-preview-attachment';
export const LSK_CHANNEL_PREVIEW_EMPTY_MESSAGE =
  'channel-preview-empty-message';
export const LSK_CHANNEL_PREVIEW_MESSENGER_NO_MESSAGE =
  'channel-preview-messenger-no-message';
export const LSK_SEND_MESSAGE_BUTTON_TITLE = 'send-message-button-title';
export const LSK_ATTACHMENT_ACTIONSHEET_TITLE = 'attachment-actionsheet-title';
export const LSK_ATTACHMENT_ACTIONSHEET_UPLOAD_PHOTO_OPTION =
  'attachment-actionsheet-upload-photo-option';
export const LSK_ATTACHMENT_ACTIONSHEET_UPLOAD_FILE_OPTION =
  'attachment-actionsheet-upload-file-option';
export const LSK_EVENT_INDICATOR_MEMBER_JOINED =
  'event-indicator-member-joined';
export const LSK_EVENT_INDICATOR_MEMBER_REMOVED =
  'event-indicator-member-removed';
export const LSK_LOADING_INDICATOR_LOADING_CHANNELS =
  'loading-indicator-loading-channels';
export const LSK_LOADING_INDICATOR_LOADING_MESSAGES =
  'loading-indicator-loading-messages';
export const LSK_LOADING_INDICATOR_LOADING_DEFAULT =
  'loading-indicator-loading-default';
export const LSK_LOADING_ERROR_INDICATOR_CHANNELS =
  'loading-error-indicator-channels';
export const LSK_LOADING_ERROR_INDICATOR_MESSAGES =
  'loading-error-indicator-messages';
export const LSK_LOADING_ERROR_INDICATOR_DEFAULT =
  'loading-error-indicator-default';
export const LSK_NEW_MESSAGE_NOTIFICATION = 'new-message-notification';
export const LSK_THREAD_HEADER_MESSAGE = 'thread-header-message';
export const LSK_MESSAGELIST_CONNECTION_FAILURE_MESSAGE =
  'messagelist-connection-failure-message';
export const LSK_MESSAGE_ACTIONSHEET_TITLE = 'message-actionsheet-title';
export const LSK_MESSAGE_ACTIONSHEET_REPLY_OPTION =
  'message-actionsheet-reply-option';
export const LSK_MESSAGE_ACTIONSHEET_REACTION_OPTION =
  'message-actionsheet-reaction-option';
export const LSK_MESSAGE_ACTIONSHEET_EDIT_OPTION =
  'message-actionsheet-edit-option';
export const LSK_MESSAGE_ACTIONSHEET_DELETE_OPTION =
  'message-actionsheet-delete-option';
export const LSK_MESSAGE_DELETED_TEXT = 'message-deleted-text';

export const defaultStrings = {
  'auto-complete-input-placeholder': 'Write your message',
  'no-channel-selected-message': 'Please select a channel first',
  'channel-missing-message': 'Channel Missing',
  'single-user-typing': '{0} is typing...',
  'two-users-typing': '{0} and {1} are typing...',
  'multiple-users-typing': '{0} and {1} are typing...',
  'channel-preview-no-message': 'Nothing yet...',
  'channel-preview-message-deleted': 'Message Deleted',
  'channel-preview-attachment': '🏙 Attachment...',
  'channel-preview-empty-message': 'Empty Message...',
  'channel-preview-messenger-no-message': 'Nothing yet...',
  'send-message-button-title': 'Send Message',
  'attachment-actionsheet-title': 'Add a file',
  'attachment-actionsheet-upload-photo-option': 'Upload a photo',
  'attachment-actionsheet-upload-file-option': 'Upload a file',
  'event-indicator-member-joined': '{0} joined the chatss',
  'event-indicator-member-removed': '{0} was removed from the chat',
  'loading-indicator-loading-channels': 'Loading channels ...',
  'loading-indicator-loading-messages': 'Loading messages ...',
  'loading-indicator-loading-default': 'Loading ...',
  'loading-error-indicator-channels': 'Error loading channel list ...',
  'loading-error-indicator-messages':
    'Error loading messages for this channel ...',
  'loading-error-indicator-default': 'Error loading',
  'new-message-notification': 'New Messages boo',
  'thread-header-message': 'Start of a new thread',
  'messagelist-connection-failure-message':
    'Connection failure, reconnecting now aa...',
  'message-actionsheet-title': 'Choose an action',
  'message-actionsheet-reply-option': 'Reply',
  'message-actionsheet-reaction-option': 'Add Reaction',
  'message-actionsheet-edit-option': 'Edit Message',
  'message-actionsheet-delete-option': 'Delete Message',
  'message-deleted-text': 'This message was deleted ...',
};

export const DEFAULT_LANGUAGE = 'en';

export const getLocalizedStringInstance = (strings, language) => {
  let ls;
  if (!strings) {
    ls = new LocalizedStrings({ en: defaultStrings });
  } else {
    const languages = Object.keys(strings);
    if (languages.indexOf(DEFAULT_LANGUAGE) === -1) {
      ls = new LocalizedStrings({
        en: defaultStrings,
        ...strings,
      });
    } else {
      ls = new LocalizedStrings({ strings });
    }
  }

  ls.setLanguage(language);

  return ls;
};
