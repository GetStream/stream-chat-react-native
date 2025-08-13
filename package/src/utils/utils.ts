import type React from 'react';

import dayjs from 'dayjs';
import EmojiRegex from 'emoji-regex';
import type {
  AttachmentLoadingState,
  ChannelState,
  LocalMessage,
  MessageResponse,
} from 'stream-chat';

import { IconProps } from '../../src/icons/utils/base';
import type { TableRowJoinedUser } from '../store/types';
import { ValueOf } from '../types/types';

export type ReactionData = {
  Icon: React.ComponentType<IconProps>;
  type: string;
};

export const FileState = Object.freeze({
  BLOCKED: 'blocked',
  FAILED: 'failed',
  FINISHED: 'finished',
  PENDING: 'pending',
  UPLOADING: 'uploading',
});

export const ProgressIndicatorTypes: {
  IN_PROGRESS: 'in_progress';
  INACTIVE: 'inactive';
  NOT_SUPPORTED: 'not_supported';
  PENDING: 'pending';
  RETRY: 'retry';
} = Object.freeze({
  IN_PROGRESS: 'in_progress',
  INACTIVE: 'inactive',
  NOT_SUPPORTED: 'not_supported',
  PENDING: 'pending',
  RETRY: 'retry',
});

export const MessageStatusTypes = {
  FAILED: 'failed',
  RECEIVED: 'received',
  SENDING: 'sending',
};

export type Progress = ValueOf<typeof ProgressIndicatorTypes>;
type IndicatorStatesMap = Record<AttachmentLoadingState, Progress | undefined>;

export const getIndicatorTypeForFileState = (
  fileState: AttachmentLoadingState,
  enableOfflineSupport: boolean,
): Progress | undefined => {
  const indicatorMap: IndicatorStatesMap = {
    [FileState.UPLOADING]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.IN_PROGRESS,
    [FileState.BLOCKED]: ProgressIndicatorTypes.NOT_SUPPORTED,
    [FileState.FAILED]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.RETRY,
    [FileState.PENDING]: ProgressIndicatorTypes.PENDING,
    [FileState.FINISHED]: ProgressIndicatorTypes.INACTIVE,
  };

  return indicatorMap[fileState];
};

/**
 * Utility to check if the message is a Blocked message.
 * @param message
 * @returns boolean
 */
export const isBlockedMessage = (message: LocalMessage | TableRowJoinedUser<'messages'>) => {
  // The only indicator for the blocked message is its message type is error and that the message text contains "Message was blocked by moderation policies".
  const pattern = /\bMessage was blocked by moderation policies\b/;
  return message.type === 'error' && message.text && pattern.test(message.text);
};

/**
 *  Utility to check if the message is a Bounced message.
 * @param message
 * @returns boolean
 */
export const isBouncedMessage = (message: LocalMessage) =>
  (message.type === 'error' &&
    message?.moderation_details?.action === 'MESSAGE_RESPONSE_ACTION_BOUNCE') ||
  message?.moderation?.action === 'bounce';

/**
 * Utility to check if the message is a edited message.
 * @param message
 * @returns boolean
 */
export const isEditedMessage = (message: LocalMessage) => !!message.message_text_updated_at;

export const makeImageCompatibleUrl = (url: string) =>
  (url.indexOf('//') === 0 ? `https:${url}` : url).trim();

export const getUrlWithoutParams = (url?: string) => {
  if (!url) {
    return url;
  }

  const indexOfQuestion = url.indexOf('?');
  if (indexOfQuestion === -1) {
    return url;
  }

  return url.substring(0, url.indexOf('?'));
};

export const isLocalUrl = (url: string) => !url.includes('http');

export const generateRandomId = (a = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateRandomId);

/*
 * Returns true if the message text only contains emojis
 */
export const hasOnlyEmojis = (text: string) => {
  try {
    // get all emojis in the string
    const emojiOnlyString = [...text.matchAll(EmojiRegex())].join('');
    // remove all spaces from original text
    const originalTextWithNoSpaces = text.replaceAll(/\s/g, '');
    // check if both are the same
    return (
      emojiOnlyString.length !== 0 && emojiOnlyString.length === originalTextWithNoSpaces.length
    );
  } catch (e) {
    return false;
  }
};

/**
 * Stringifies a message object
 * @param {LocalMessage} message - the message object to be stringified
 * @returns {string} The stringified message
 */
export const stringifyMessage = ({
  message,
  includeReactions = true,
}: {
  message: MessageResponse | LocalMessage;
  includeReactions?: boolean;
}): string => {
  const {
    attachments,
    deleted_at,
    i18n,
    latest_reactions,
    reaction_groups,
    reply_count,
    status,
    text,
    type,
    updated_at,
  } = message;
  const baseFieldsString = `${type}${deleted_at}${text}${reply_count}${status}${updated_at}${JSON.stringify(i18n)}${attachments?.length}`;
  if (!includeReactions) {
    return baseFieldsString;
  }
  return `${
    latest_reactions ? latest_reactions.map(({ type, user }) => `${type}${user?.id}`).join() : ''
  }${
    reaction_groups
      ? Object.entries(reaction_groups)
          .flatMap(
            ([type, { count, first_reaction_at, last_reaction_at }]) =>
              `${type}${count}${first_reaction_at}${last_reaction_at}`,
          )
          .join()
      : ''
  }${baseFieldsString}`;
};

/**
 * Reduces a list of messages to strings that are used in useEffect & useMemo
 * @param {messages} messages - the array of messages to be compared
 * @returns {string} The mapped message string
 */
export const reduceMessagesToString = (messages: LocalMessage[]): string =>
  messages
    .map((message) =>
      message?.quoted_message
        ? `${stringifyMessage({ message })}_${message.quoted_message.type}_${message.quoted_message.deleted_at}_${message.quoted_message.text}_${message.quoted_message.updated_at}`
        : stringifyMessage({ message }),
    )
    .join();

/**
 * Utility to get the file name from the path using regex.
 * `[^/]+` matches one or more characters that are not a slash (/), ensuring we capture the filename part.
 * `\.` matches the period before the file extension.
 * `[^/]+$` matches one or more characters that are not a slash (/) until the end of the string, capturing the file extension.
 * @param path string
 * @returns string
 */
export const getFileNameFromPath = (path: string) => {
  const pattern = /[^/]+\.[^/]+$/;
  const match = path.match(pattern);
  return match ? match[0] : '';
};

/**
 * Utility to get the duration label from the duration in seconds.
 * @param duration number
 * @returns string
 */
export const getDurationLabelFromDuration = (duration: number) => {
  if (!duration) {
    return '00:00';
  }

  const ONE_HOUR_IN_SECONDS = 3600;
  const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000;
  let durationLabel = '00:00';
  const isDurationLongerThanHour = duration / ONE_HOUR_IN_MILLISECONDS >= 1;
  const formattedDurationParam = isDurationLongerThanHour ? 'HH:mm:ss' : 'mm:ss';
  const formattedVideoDuration = dayjs
    .duration(duration, 'milliseconds')
    .format(formattedDurationParam);
  durationLabel = formattedVideoDuration;

  return durationLabel;
};

/**
 * Utility to escape special characters in a string.
 * @param text
 * @returns string
 */
export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

/**
 * Utility to find the index of a message in the messages array by id.
 * @param messages
 * @param targetId
 * @returns number
 */
export const findInMessagesById = (messages: ChannelState['messages'], targetId: string) => {
  const idx = messages.findIndex((message) => message.id === targetId);
  return idx;
};

/**
 * Utility to find the index of a message in the messages array by date.
 * @param messages
 * @param targetDate
 * @returns an object with the index and the message object
 */
export const findInMessagesByDate = (
  messages: MessageResponse[] | ChannelState['messages'],
  targetDate: Date,
) => {
  // Binary search
  const targetTimestamp = targetDate.getTime();
  let left = 0;
  let right = messages.length - 1;
  let middle = 0;
  while (left <= right) {
    middle = Math.floor(left + (right - left) / 2);
    const middleTimestamp = new Date(messages[middle].created_at as string | Date).getTime();
    const middleLeftTimestamp =
      messages[middle - 1]?.created_at &&
      new Date(messages[middle - 1].created_at as string | Date).getTime();
    const middleRightTimestamp =
      messages[middle + 1]?.created_at &&
      new Date(messages[middle + 1].created_at as string | Date).getTime();
    if (
      middleTimestamp === targetTimestamp ||
      (middleLeftTimestamp &&
        middleRightTimestamp &&
        middleLeftTimestamp < targetTimestamp &&
        middleRightTimestamp > targetTimestamp)
    ) {
      return { index: middle, message: messages[middle] };
    } else if (middleTimestamp < targetTimestamp) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return { index: -1 };
};

/**
 * The purpose of this function is to compare two messages and determine if they are equal.
 * It checks various properties of the messages, such as status, type, text, pinned state, updated_at timestamp, i18n data, and reply count.
 * If all these properties match, it returns true, indicating that the messages are considered equal.
 * If any of the properties differ, it returns false, indicating that the messages are not equal.
 * Useful for the `areEqual` logic in the React.memo of the Message component/sub-components.
 */
export const checkMessageEquality = (
  prevMessage?: LocalMessage,
  nextMessage?: LocalMessage,
): boolean => {
  const prevMessageExists = !!prevMessage;
  const nextMessageExists = !!nextMessage;
  if (!prevMessageExists && !nextMessageExists) {
    return true;
  }
  if (prevMessageExists !== nextMessageExists) {
    return false;
  }
  const messageEqual =
    prevMessage?.status === nextMessage?.status &&
    prevMessage?.type === nextMessage?.type &&
    prevMessage?.text === nextMessage?.text &&
    prevMessage?.pinned === nextMessage?.pinned &&
    prevMessage?.i18n === nextMessage?.i18n &&
    prevMessage?.reply_count === nextMessage?.reply_count &&
    prevMessage?.updated_at?.getTime?.() === nextMessage?.updated_at?.getTime?.() &&
    prevMessage?.deleted_at?.getTime?.() === nextMessage?.deleted_at?.getTime?.();

  return messageEqual;
};

/**
 * The purpose of this function is to compare two quoted messages and determine if they are equal.
 * It checks various properties of the messages, such as status, type, text, updated_at timestamp, and deleted_at.
 * If all these properties match, it returns true, indicating that the messages are considered equal.
 * If any of the properties differ, it returns false, indicating that the messages are not equal.
 * Useful for the `areEqual` logic in the React.memo of the Message component/sub-components.
 */
export const checkQuotedMessageEquality = (
  prevQuotedMessage?: LocalMessage,
  nextQuotedMessage?: LocalMessage,
): boolean => {
  const prevQuotedMessageExists = !!prevQuotedMessage;
  const nextQuotedMessageExists = !!nextQuotedMessage;
  if (!prevQuotedMessageExists && !nextQuotedMessageExists) {
    return true;
  }
  if (prevQuotedMessageExists !== nextQuotedMessageExists) {
    return false;
  }
  const quotedMessageEqual =
    prevQuotedMessage?.type === nextQuotedMessage?.type &&
    prevQuotedMessage?.text === nextQuotedMessage?.text &&
    prevQuotedMessage?.updated_at?.getTime?.() === nextQuotedMessage?.updated_at?.getTime?.() &&
    prevQuotedMessage?.deleted_at?.getTime?.() === nextQuotedMessage?.deleted_at?.getTime?.();

  return quotedMessageEqual;
};
