import type { ScheduledMessageResponse } from 'stream-chat';
import { SCHEDULED_MESSAGE_FAILURE_REASON } from 'stream-chat';

import type { StreamTFunction } from '../../../i18n/types';

/** The copy shown under a failed scheduled message, or `undefined` when there is nothing to say. */
export const getScheduledMessageFailureText = (
  t: StreamTFunction,
  { failure_reason }: Pick<ScheduledMessageResponse, 'failure_reason'>,
) => {
  switch (failure_reason) {
    case SCHEDULED_MESSAGE_FAILURE_REASON.Banned:
      return t('scheduledMessages.failure.banned.text', "You can't send messages in this channel.");
    case SCHEDULED_MESSAGE_FAILURE_REASON.NoPermission:
      return t(
        'scheduledMessages.failure.noPermission.text',
        "You're no longer allowed to post here.",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen:
      return t('scheduledMessages.failure.channelFrozen.text', 'This channel is frozen.');
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted:
      return t('scheduledMessages.failure.channelDeleted.text', 'This channel was deleted');
    case SCHEDULED_MESSAGE_FAILURE_REASON.ModerationBlocked:
      return t('scheduledMessages.failure.moderationBlocked.text', 'Blocked by moderation.');
    case SCHEDULED_MESSAGE_FAILURE_REASON.HookRejected:
      return t('scheduledMessages.failure.hookRejected.text', 'Rejected by the app.');
    case SCHEDULED_MESSAGE_FAILURE_REASON.Expired:
      return t('scheduledMessages.failure.expired.text', 'Not sent: the service was delayed.');
    case SCHEDULED_MESSAGE_FAILURE_REASON.InvalidMessage:
      return t(
        'scheduledMessages.failure.invalidMessage.text',
        "The message no longer meets the app's limits. Edit it.",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported:
      return t(
        'scheduledMessages.failure.pendingNotSupported.text',
        'This channel now needs approval. Schedule it again.',
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.InternalError:
      return t('scheduledMessages.failure.internalError.text', 'Something went wrong. Try again');
    case SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted:
      return undefined;
    default:
      return t('scheduledMessages.failure.default.text', "Couldn't send. Try again");
  }
};
