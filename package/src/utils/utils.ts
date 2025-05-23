import type React from 'react';

import dayjs from 'dayjs';
import EmojiRegex from 'emoji-regex';
import type { ChannelState, LocalMessage, MessageResponse } from 'stream-chat';

import { IconProps } from '../../src/icons/utils/base';
import type { EmojiSearchIndex } from '../contexts/messageInputContext/MessageInputContext';
import { compiledEmojis } from '../emoji-data';
import type { TableRowJoinedUser } from '../store/types';
import { FileTypes, ValueOf } from '../types/types';

export type ReactionData = {
  Icon: React.ComponentType<IconProps>;
  type: string;
};

export const FileState = Object.freeze({
  // finished and uploaded state are the same thing. First is set on frontend,
  // while later is set on backend side
  // TODO: Unify both of them
  FINISHED: 'finished',
  NOT_SUPPORTED: 'not_supported',
  UPLOAD_FAILED: 'upload_failed',
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading',
});

export const ProgressIndicatorTypes: {
  IN_PROGRESS: 'in_progress';
  INACTIVE: 'inactive';
  NOT_SUPPORTED: 'not_supported';
  RETRY: 'retry';
} = Object.freeze({
  IN_PROGRESS: 'in_progress',
  INACTIVE: 'inactive',
  NOT_SUPPORTED: 'not_supported',
  RETRY: 'retry',
});

export const MessageStatusTypes = {
  FAILED: 'failed',
  RECEIVED: 'received',
  SENDING: 'sending',
};

export type FileStateValue = (typeof FileState)[keyof typeof FileState];

type Progress = ValueOf<typeof ProgressIndicatorTypes>;
type IndicatorStatesMap = Record<ValueOf<typeof FileState>, Progress | null>;

export const getIndicatorTypeForFileState = (
  fileState: FileStateValue,
  enableOfflineSupport: boolean,
): Progress | null => {
  const indicatorMap: IndicatorStatesMap = {
    [FileState.UPLOADING]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.IN_PROGRESS,
    // If offline support is disabled, then there is no need
    [FileState.UPLOAD_FAILED]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.RETRY,
    [FileState.NOT_SUPPORTED]: ProgressIndicatorTypes.NOT_SUPPORTED,
    [FileState.UPLOADED]: ProgressIndicatorTypes.INACTIVE,
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

/**
 * Default emoji search index for auto complete text input
 */
export const defaultEmojiSearchIndex: EmojiSearchIndex = {
  search: (query) => {
    try {
      const results = [];

      for (const emoji of compiledEmojis) {
        if (results.length >= 10) {
          return results;
        }
        if (emoji.names.some((name) => name.includes(query))) {
          // Aggregate skins as different toned emojis - if skins are present
          if (emoji.skins) {
            results.push({
              ...emoji,
              name: `${emoji.name}-tone-1`,
              skins: undefined,
            });
            emoji.skins.forEach((tone, index) =>
              results.push({
                ...emoji,
                name: `${emoji.name}-tone-${index + 2}`,
                skins: undefined,
                unicode: tone,
              }),
            );
          } else {
            results.push(emoji);
          }
        }
      }

      return results;
    } catch (error) {
      console.warn('Error searching emojis:', error);
      throw error;
    }
  },
};

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

export const isLocalUrl = (url: string) => url.indexOf('http') !== 0;

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
export const stringifyMessage = (message: MessageResponse | LocalMessage): string => {
  const {
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
  }${type}${deleted_at}${text}${reply_count}${status}${updated_at}${JSON.stringify(i18n)}`;
};

/**
 * Reduces a list of messages to strings that are used in useEffect & useMemo
 * @param {messages} messages - the array of messages to be compared
 * @returns {string} The mapped message string
 */
export const reduceMessagesToString = (messages: LocalMessage[]): string =>
  messages.map(stringifyMessage).join();

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

export const getFileTypeFromMimeType = (mimeType: string) => {
  const fileType = mimeType.split('/')[0];
  if (fileType === 'image') {
    return FileTypes.Image;
  } else if (fileType === 'video') {
    return FileTypes.Video;
  } else if (fileType === 'audio') {
    return FileTypes.Audio;
  }
  return FileTypes.File;
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
