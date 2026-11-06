import { usePollContext, useTranslationContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

/**
 * Returns a stable callback that closes the current poll and emits a success or failure
 * notification. Shared by the end vote button and its accessibility action.
 *
 * @returns An async callback that resolves with the close response and rethrows on failure.
 */
export const useEndVote = () => {
  const { poll } = usePollContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();

  return useStableCallback(async () => {
    try {
      const response = await poll.close();
      addNotification({
        message: t('notifications.pollEnded.text', 'Poll ended'),
        options: { severity: 'success', type: 'api:poll:end:success' },
        origin: { emitter: 'PollActions' },
      });
      return response;
    } catch (error) {
      addNotification({
        message: t('poll.endVote.error'),
        options: {
          ...(error instanceof Error ? { originalError: error } : {}),
          severity: 'error',
          type: 'api:poll:end:failed',
        },
        origin: { emitter: 'PollActions' },
      });
      throw error;
    }
  });
};
