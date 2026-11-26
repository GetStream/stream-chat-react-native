import {
  CORE_NOTIFICATION_TYPE,
  getScheduledMessageErrorReason,
  ScheduledMessageErrorReason,
} from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { DEFAULT_HIGHLIGHT_DURATION } from '../../MessageList/hooks/useMessageListFocus';
import { useNotificationApi } from '../../Notifications/hooks/useNotificationApi';
import { getScheduleErrorText } from '../utils/scheduleErrors';

export type ScheduleComposerMessageResult = {
  /** The error to show, when the message wasn't scheduled. */
  errorText?: string;
  /** The server refused because the user has reached their limit. */
  isUserLimit?: boolean;
};

/**
 * Schedules the composer's message. With `fromTimeSheet`, the time sheet shows a failure itself,
 * so the composer's toast for it is removed.
 */
export const useScheduleComposerMessage = () => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();
  const { client } = useChatContext();
  const messageComposer = useMessageComposer();
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();

  const showSentNow = useStableCallback((messageId: string) => {
    const paginator = thread ? thread.messagePaginator : channel.messagePaginator;
    addNotification({
      message: t('scheduledMessages.sentNow.text', 'Scheduled message sent'),
      options: {
        actions: [
          {
            handler: () => {
              paginator
                .jumpToMessage(messageId, {
                  focusReason: 'jump-to-message',
                  focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
                })
                .catch(() => undefined);
            },
            label: t('scheduledMessages.view.label', 'View'),
          },
        ],
        severity: 'success',
        type: 'api:scheduled-message:send-now:success',
      },
      origin: { context: { channel }, emitter: 'ScheduleMessageSheet' },
    });
  });

  return useStableCallback(
    async (
      scheduledAt: Date,
      { fromTimeSheet = false }: { fromTimeSheet?: boolean } = {},
    ): Promise<ScheduleComposerMessageResult> => {
      const messageId = messageComposer.id;
      const result = await messageComposer.scheduleMessage(scheduledAt);

      switch (result.status) {
        case 'failed': {
          if (fromTimeSheet) {
            client.notifications.notifications
              .filter(({ type }) => type === CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed)
              .forEach(({ id }) => client.notifications.remove(id));
          }
          return {
            errorText: getScheduleErrorText(t, result.error, 'schedule', channel),
            isUserLimit:
              getScheduledMessageErrorReason(result.error) ===
              ScheduledMessageErrorReason.UserLimit,
          };
        }
        case 'blocked':
          return {
            errorText: t(
              'scheduledMessages.commandBlocked.error',
              "Commands can't be scheduled. Remove the / command to continue.",
            ),
          };
        case 'sent':
          showSentNow(messageId);
          return {};
        default:
          return {};
      }
    },
  );
};
