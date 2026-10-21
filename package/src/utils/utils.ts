import type React from 'react';

import dayjs from 'dayjs';
import EmojiRegex from 'emoji-regex';
import type { AttachmentLoadingState, LocalMessage, MessageResponse } from 'stream-chat';

import { IconProps } from '../../src/icons/utils/base';
import { ValueOf } from '../types/types';

export type ReactionData = {
  Icon: React.ComponentType<IconProps>;
  type: string;
  /**
   * Whether the reaction appears in the context menu's reaction picker. When `true`, it does not
   * appear in the extra reactions bottom sheet.
   */
  isMain?: boolean;
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
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RECEIVED: 'received',
  SENDING: 'sending',
};

export type Progress = ValueOf<typeof ProgressIndicatorTypes>;
type IndicatorStatesMap = Record<AttachmentLoadingState, Progress | undefined>;

export const getIndicatorTypeForFileState = (
  fileState: AttachmentLoadingState,
  pendingUploadsEnabled: boolean,
): Progress | undefined => {
  const indicatorMap: IndicatorStatesMap = {
    [FileState.UPLOADING]: pendingUploadsEnabled
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.IN_PROGRESS,
    [FileState.BLOCKED]: ProgressIndicatorTypes.NOT_SUPPORTED,
    [FileState.FAILED]: pendingUploadsEnabled
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.RETRY,
    [FileState.PENDING]: ProgressIndicatorTypes.PENDING,
    [FileState.FINISHED]: ProgressIndicatorTypes.INACTIVE,
  };

  return indicatorMap[fileState];
};

/**
 * Whether the message was blocked by moderation.
 *
 * @param message The message to check.
 * @returns Whether the message is blocked.
 */
export const isBlockedMessage = (message: LocalMessage) => {
  return message.type === 'error' && message.moderation?.action === 'remove';
};

/**
 * Whether the message was bounced by moderation.
 *
 * @param message The message to check.
 * @returns Whether the message is bounced.
 */
export const isBouncedMessage = (message: LocalMessage) =>
  message.type === 'error' && message?.moderation?.action === 'bounce';

/**
 * Whether the message text has been edited.
 *
 * @param message The message to check.
 * @returns Whether the message is edited.
 */
export const isEditedMessage = (message: LocalMessage) => message.message_text_updated_at != null;

export const makeImageCompatibleUrl = (url?: string) =>
  url ? (url.indexOf('//') === 0 ? `https:${url}` : url).trim() : url;

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

/**
 * Whether the URL points at a file on the device rather than something fetchable over HTTP(S).
 * An undefined URL is not local.
 *
 * Matches on the scheme, not on `http` anywhere in the string, because a `content://` or `ph://`
 * URI may contain that substring.
 */
export const isLocalUrl = (url?: string) => !!url && !/^https?:\/\//i.test(url.trim());

export const generateRandomId = (a = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateRandomId);

/** Whether the text contains only emojis, ignoring whitespace. */
export const hasOnlyEmojis = (text: string) => {
  try {
    const emojiOnlyString = [...text.matchAll(EmojiRegex())].join('');
    const originalTextWithNoSpaces = text.replaceAll(/\s/g, '');
    return (
      emojiOnlyString.length !== 0 && emojiOnlyString.length === originalTextWithNoSpaces.length
    );
  } catch (e) {
    return false;
  }
};

/**
 * Stringifies the fields of a message that affect how it renders, to compare messages cheaply.
 *
 * @param params.message The message to stringify.
 * @param params.includeReactions Whether to include the reactions. Defaults to true.
 * @returns The stringified message.
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
    text,
    type,
    updated_at,
  } = message;
  // `status` only exists on `LocalMessage`, not on a bare `MessageResponse`.
  const status = 'status' in message ? message.status : undefined;
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
 * Returns the file name, including its extension, from the last segment of a path.
 *
 * @param path The file path or URI.
 * @returns The file name, or an empty string when the last segment has no extension.
 */
export const getFileNameFromPath = (path: string) => {
  const pattern = /[^/]+\.[^/]+$/;
  const match = path.match(pattern);
  return match ? match[0] : '';
};

/**
 * Formats a duration as `m:ss`, or `HH:mm:ss` from one hour.
 *
 * @param duration The duration in milliseconds.
 * @returns The duration label, `00:00` for a zero or missing duration.
 */
export const getDurationLabelFromDuration = (duration: number) => {
  if (!duration) {
    return '00:00';
  }

  const ONE_HOUR_IN_SECONDS = 3600;
  const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000;
  let durationLabel = '00:00';
  const isDurationLongerThanHour = duration / ONE_HOUR_IN_MILLISECONDS >= 1;
  const formattedDurationParam = isDurationLongerThanHour ? 'HH:mm:ss' : 'm:ss';
  const formattedVideoDuration = dayjs
    .duration(duration, 'milliseconds')
    .format(formattedDurationParam);
  durationLabel = formattedVideoDuration;

  return durationLabel;
};

export const formatMsToMinSec = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  if (totalHours >= 1) {
    return `${totalHours}h`;
  }

  if (totalMinutes >= 1) {
    return `${totalMinutes}m`;
  }

  return `${totalSeconds}s`;
};

/**
 * Escapes the characters that have a special meaning in a regular expression.
 *
 * @param text The text to escape.
 * @returns The escaped text.
 */
export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

/**
 * Whether two messages are equal for rendering purposes, for use in `React.memo` comparators.
 * Compares `status`, `type`, `text`, `pinned`, `i18n` (by reference), `reply_count`, `updated_at`
 * and `deleted_at`. Two missing messages are equal.
 *
 * @param prevMessage The previous message.
 * @param nextMessage The next message.
 * @returns Whether the messages are equal.
 */
export const checkMessageEquality = (
  prevMessage?: LocalMessage | MessageResponse | null,
  nextMessage?: LocalMessage | MessageResponse | null,
): boolean => {
  const prevMessageExists = !!prevMessage;
  const nextMessageExists = !!nextMessage;
  if (!prevMessageExists && !nextMessageExists) {
    return true;
  }
  if (prevMessageExists !== nextMessageExists) {
    return false;
  }
  // `status` exists only on `LocalMessage`, so it is read through an `in` guard.
  const prevStatus = prevMessage && 'status' in prevMessage ? prevMessage.status : undefined;
  const nextStatus = nextMessage && 'status' in nextMessage ? nextMessage.status : undefined;
  const messageEqual =
    prevStatus === nextStatus &&
    prevMessage?.type === nextMessage?.type &&
    prevMessage?.text === nextMessage?.text &&
    prevMessage?.pinned === nextMessage?.pinned &&
    prevMessage?.i18n === nextMessage?.i18n &&
    prevMessage?.reply_count === nextMessage?.reply_count &&
    prevMessage?.updated_at === nextMessage?.updated_at &&
    prevMessage?.deleted_at === nextMessage?.deleted_at;

  return messageEqual;
};

/**
 * Whether two quoted messages are equal for rendering purposes, for use in `React.memo`
 * comparators. Compares `type`, `text`, `updated_at` and `deleted_at`. Two missing messages are
 * equal.
 *
 * @param prevQuotedMessage The previous quoted message.
 * @param nextQuotedMessage The next quoted message.
 * @returns Whether the quoted messages are equal.
 */
export const checkQuotedMessageEquality = (
  prevQuotedMessage?: LocalMessage | MessageResponse | null,
  nextQuotedMessage?: LocalMessage | MessageResponse | null,
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
    prevQuotedMessage?.updated_at === nextQuotedMessage?.updated_at &&
    prevQuotedMessage?.deleted_at === nextQuotedMessage?.deleted_at;

  return quotedMessageEqual;
};

/**
 * Returns the uppercase first letters of the first words of a name.
 *
 * @param name The full name.
 * @param numberOfInitials How many initials to return. Defaults to 2.
 * @returns The initials, or an empty string for a blank name.
 */
export const getInitialsFromName = (name: string, numberOfInitials: number = 2) => {
  if (!name) return '';
  const trimmed = name.trim();

  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .slice(0, numberOfInitials)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
};

export const hashStringToNumber = (str: string) => {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash) ?? 0;
};

export const getFileSizeDisplayText = (size?: number | string) => {
  if (!size) {
    return;
  }
  if (typeof size === 'string') {
    size = parseFloat(size);
  }

  if (size < 1000 * 1000) {
    return `${Math.floor(Math.floor(size / 10) / 100)} KB`;
  }

  return `${Math.floor(Math.floor(size / 10000) / 100)} MB`;
};
