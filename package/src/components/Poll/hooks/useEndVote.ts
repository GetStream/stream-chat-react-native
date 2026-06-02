import { usePollContext, useTranslationContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

/**
 * Returns a stable callback that closes the current poll and emits a success or
 * failure notification. Shared by `EndVoteButton` and the rotor accessibility
 * action so both paths produce identical side effects.
 */
export const useEndVote = () => {
  const { poll } = usePollContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();

  return useStableCallback(async () => {
    try {
      const response = await poll.close();
      addNotification({
        message: t('Poll ended'),
        options: { severity: 'success', type: 'api:poll:end:success' },
        origin: { emitter: 'PollActions' },
      });
      return response;
    } catch (error) {
      addNotification({
        message: t('Failed to end the poll'),
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
