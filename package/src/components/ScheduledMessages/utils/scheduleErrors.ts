import type { Channel } from 'stream-chat';
import {
  getScheduledMessageErrorReason,
  getScheduledMessageLimits,
  ScheduledMessageErrorReason,
} from 'stream-chat';

import type { StreamTFunction } from '../../../i18n/types';

const getErrorStatus = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: unknown }).status
    : undefined;

/**
 * The copy shown in the date and time sheet when scheduling or rescheduling fails. `channel` supplies
 * the per-user limit for its copy.
 */
export const getScheduleErrorText = (
  t: StreamTFunction,
  error: unknown,
  action: 'schedule' | 'reschedule' | 'update' = 'schedule',
  channel?: Channel,
) => {
  switch (getScheduledMessageErrorReason(error)) {
    case ScheduledMessageErrorReason.TooSoon:
      return t(
        'scheduledMessages.rescheduleTooSoon.error',
        "Pick a later time. Editing can't send a message right away.",
      );
    case ScheduledMessageErrorReason.TooFar:
      return t('scheduledMessages.tooFar.error', "That's further ahead than your app allows");
    case ScheduledMessageErrorReason.ChannelLimit:
      return t(
        'scheduledMessages.channelLimit.error',
        "You've reached the limit of scheduled messages in this channel.",
      );
    case ScheduledMessageErrorReason.UserLimit: {
      const maxPerUser = channel ? getScheduledMessageLimits(channel)?.maxPerUser : undefined;
      // The limit is only known when the channel's config carries it.
      return maxPerUser === undefined
        ? t('scheduledMessages.userLimit.error', "You've reached your limit of scheduled messages.")
        : t(
            'scheduledMessages.userLimitCount.error',
            "You've reached your limit of {{ count }} scheduled messages.",
            { count: maxPerUser },
          );
    }
    case ScheduledMessageErrorReason.Disabled:
      return t('scheduledMessages.disabled.error', 'Scheduled messages are turned off');
    case ScheduledMessageErrorReason.AlreadySent:
      return t('scheduledMessages.alreadySent.error', 'This message was already sent');
    default:
      if (getErrorStatus(error) === 403) {
        return t('scheduledMessages.forbidden.error', "You can't schedule messages here");
      }
      if (action === 'reschedule') {
        return t(
          'scheduledMessages.rescheduleFailed.error',
          "Couldn't reschedule the message. Try again",
        );
      }
      if (action === 'update') {
        return t(
          'scheduledMessages.updateFailed.error',
          "Couldn't update the scheduled message. Try again",
        );
      }
      return t('scheduledMessages.scheduleFailed.error', "Couldn't schedule message. Try again");
  }
};
