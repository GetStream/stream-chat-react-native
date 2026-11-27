import { useMemo } from 'react';

import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';
import {
  getScheduledMessageErrorReason,
  isScheduledMessageNotFoundError,
  ScheduledMessageErrorReason,
} from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../hooks/actions/useChannelActions';
import { NativeHandlers } from '../../../native';
import { useNotificationApi } from '../../Notifications/hooks/useNotificationApi';
import { hasDeletedQuote } from '../utils/quote';
import { getScheduleErrorText } from '../utils/scheduleErrors';

/** The channel a scheduled message belongs to, whether or not the app has loaded it. */
export const getScheduledMessageChannel = (
  client: StreamChat,
  scheduledMessage: ScheduledMessageResponse,
) => {
  const [type, ...idParts] = scheduledMessage.cid.split(':');
  return client.channel(type, idParts.join(':'));
};

/** The requests behind the actions of a scheduled messages list, with their notifications. */
export const useScheduledMessageActionHandlers = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();

  return useMemo(() => {
    const notifyAlreadySent = () =>
      addNotification({
        message: t('scheduledMessages.alreadySent.text', "Already sent. It's in the channel now."),
        options: { severity: 'info', type: 'api:scheduled-message:already-sent' },
        origin: { emitter: 'ScheduledMessageList' },
      });

    const notifyStillSending = () =>
      addNotification({
        message: t('scheduledMessages.stillSending.text', 'Still sending. Try again in a moment.'),
        options: { severity: 'info', type: 'api:scheduled-message:sending' },
        origin: { emitter: 'ScheduledMessageList' },
      });

    // Sending or rescheduling a message whose quote was deleted is refused here, with no request.
    const refuseDeletedQuote = (scheduledMessage: ScheduledMessageResponse) => {
      if (!hasDeletedQuote(scheduledMessage)) return false;
      addNotification({
        message: t(
          'scheduledMessages.quoteDeleted.text',
          'The quoted message was deleted. Edit it to remove the quote.',
        ),
        options: { severity: 'info', type: 'api:scheduled-message:quote-deleted' },
        origin: { emitter: 'ScheduledMessageList' },
      });
      return true;
    };

    const notifyError = (message: string, error: unknown, type: string) =>
      addNotification({
        message,
        options: { ...getNotificationErrorOptions(error), severity: 'error', type },
        origin: { emitter: 'ScheduledMessageList' },
      });

    const deleteScheduledMessage = async (scheduledMessage: ScheduledMessageResponse) => {
      const channel = getScheduledMessageChannel(client, scheduledMessage);
      try {
        await channel.messageOperations.deleteScheduledMessage(scheduledMessage.id);
      } catch (error) {
        if (isScheduledMessageNotFoundError(error)) {
          notifyAlreadySent();
          return;
        }
        if (getScheduledMessageErrorReason(error) === ScheduledMessageErrorReason.Sending) {
          notifyStillSending();
          return;
        }
        notifyError(
          t(
            'scheduledMessages.deleteFailed.error',
            "Couldn't delete the scheduled message. Try again",
          ),
          error,
          'api:scheduled-message:delete:failed',
        );
      }
    };

    const sendScheduledMessageNow = async (scheduledMessage: ScheduledMessageResponse) => {
      if (refuseDeletedQuote(scheduledMessage)) return;
      const channel = getScheduledMessageChannel(client, scheduledMessage);
      try {
        await channel.messageOperations.sendScheduledMessageNow(scheduledMessage.id);
        addNotification({
          message: t('scheduledMessages.sentNow.text', 'Scheduled message sent'),
          options: { severity: 'success', type: 'api:scheduled-message:send-now:success' },
          origin: { emitter: 'ScheduledMessageList' },
        });
      } catch (error) {
        if (isScheduledMessageNotFoundError(error)) {
          notifyAlreadySent();
          return;
        }
        if (getScheduledMessageErrorReason(error) === ScheduledMessageErrorReason.Sending) {
          notifyStillSending();
          return;
        }
        notifyError(
          t('scheduledMessages.sendNowFailed.error', "Couldn't send the message. Try again"),
          error,
          'api:scheduled-message:send-now:failed',
        );
      }
    };

    /** Moves a scheduled message to `scheduledAt`. Resolves with an error to show, or nothing. */
    const rescheduleScheduledMessage = async (
      scheduledMessage: ScheduledMessageResponse,
      scheduledAt: Date,
    ) => {
      const channel = getScheduledMessageChannel(client, scheduledMessage);
      try {
        // A failed message comes back as a new one, and the failed one is deleted.
        await channel.messageOperations.rescheduleScheduledMessage(scheduledMessage, scheduledAt);
        return undefined;
      } catch (error) {
        if (isScheduledMessageNotFoundError(error)) {
          notifyAlreadySent();
          return undefined;
        }
        return getScheduleErrorText(t, error, 'reschedule', channel);
      }
    };

    const copyScheduledMessageText = (scheduledMessage: ScheduledMessageResponse) => {
      const { text } = scheduledMessage.message;
      if (!text) return;
      NativeHandlers.setClipboardString(text, {
        onFailure: (error) =>
          notifyError(
            t('message.copyMessage.error', 'Failed to copy message'),
            error,
            'clipboard:message:copy:failed',
          ),
      });
    };

    return {
      copyScheduledMessageText,
      deleteScheduledMessage,
      notifyStillSending,
      refuseDeletedQuote,
      rescheduleScheduledMessage,
      sendScheduledMessageNow,
    };
  }, [addNotification, client, t]);
};
