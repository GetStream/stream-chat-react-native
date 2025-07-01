import { useCallback } from 'react';

import type { ReminderManagerState } from 'stream-chat';
import { useChatContext, useStateStore } from 'stream-chat-react-native';

export const useMessageReminder = (messageId: string) => {
  const { client } = useChatContext();
  const reminderSelector = useCallback(
    (state: ReminderManagerState) => ({
      reminder: state.reminders.get(messageId),
    }),
    [messageId],
  );
  const { reminder } = useStateStore(client.reminders.state, reminderSelector);
  return reminder;
};
