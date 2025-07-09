import { useCallback } from 'react';

import type { ReminderManagerState } from 'stream-chat';

import { useStateStore } from './useStateStore';

import { useChatContext } from '../contexts/chatContext/ChatContext';

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
