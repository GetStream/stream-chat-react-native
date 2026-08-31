import { useCallback, useEffect, useRef, useState } from 'react';

import { EventPayload, PaginatorState, ReminderFilters, ReminderResponseData } from 'stream-chat';

import { nowNs } from 'stream-chat';

import { useStateStore } from './useStateStore';

import { useChatContext } from '../contexts/chatContext/ChatContext';

const selector = (nextValue: PaginatorState<ReminderResponseData>) =>
  ({
    isLoading: nextValue.isLoading,
    items: nextValue.items,
  }) as const;

// Utility to sort reminders by remind_at date in ascending order
const sortRemindersByDate = (reminders: ReminderResponseData[]) => {
  return reminders.sort((a, b) => {
    if (!a.remind_at || !b.remind_at) {
      return 0; // If either remind_at is missing, keep original order
    }
    // Sort by remind_at date
    return a.remind_at - b.remind_at;
  });
};

// Utility functions to check reminder status
const isReminderOverdue = (reminder?: ReminderResponseData) => {
  return reminder?.remind_at != null && reminder.remind_at < nowNs();
};

const isReminderUpcoming = (reminder?: ReminderResponseData) => {
  return reminder?.remind_at != null && reminder.remind_at > nowNs();
};

// Utility to check if all reminders should be shown based on filters
const showAllReminders = (filters?: ReminderFilters) => {
  return filters && Object.keys(filters).length === 0;
};

/**
 * Custom hook to query reminders from the Stream Chat client.
 * It handles fetching, updating, and deleting reminders, and provides
 * a way to refresh the list and load more reminders.
 *
 * @returns {Object} - Contains data, isLoading, onEndReached, onRefresh, and setData.
 */
export const useQueryReminders = () => {
  const { client } = useChatContext();
  const { isLoading, items } = useStateStore(client.reminders.paginator.state, selector);
  const [data, setData] = useState<ReminderResponseData[]>(items ?? []);
  // The deletion and updates are not handled by the paginator, so we need to cache them
  // to avoid showing deleted or updated reminders in the list.
  const deletedOrUpdatedRemindersCache = useRef<Record<string, ReminderResponseData>>({});

  useEffect(() => {
    setData((prevData) => {
      if (!items) {
        return prevData;
      }
      const newData: ReminderResponseData[] = [];
      items.forEach((reminder) => {
        if (prevData.includes(reminder)) {
          newData.push(reminder);
        } else {
          if (!deletedOrUpdatedRemindersCache.current[reminder.message_id]) {
            newData.push(reminder);
          }
        }
      });
      return newData;
    });
  }, [items, client.reminders.paginator.filters]);

  useEffect(() => {
    const handleReminderDeleted = (event: EventPayload<'reminder.deleted'>) => {
      if (!event.reminder?.message_id) {
        return;
      }
      deletedOrUpdatedRemindersCache.current[event.reminder.message_id] = event.reminder;
      setData((prevData) => {
        return prevData.filter((item) => item.message_id !== event.reminder?.message_id);
      });
    };

    const handleReminderCreated = (event: EventPayload<'reminder.created'>) => {
      setData((prevData) => {
        if (!event.reminder) {
          return prevData;
        }
        const updatedData = [...prevData, event.reminder];
        return sortRemindersByDate(updatedData);
      });
    };

    const handleReminderUpdated = (event: EventPayload<'reminder.updated'>) => {
      const { reminder } = event;
      if (!reminder || showAllReminders(client.reminders.paginator.filters)) {
        return; // No update needed if reminder is undefined or filters is empty
      }
      deletedOrUpdatedRemindersCache.current[reminder.message_id] = reminder;
      setData((prevData) => {
        const existingReminder = prevData.find((item) => item.message_id === reminder?.message_id);
        if (!existingReminder) {
          return prevData; // No update needed if reminder not found
        }

        if (existingReminder.remind_at && !event.reminder?.remind_at) {
          return prevData.filter((item) => item.message_id !== event.reminder?.message_id);
        }
        if (!existingReminder.remind_at && event.reminder?.remind_at) {
          return prevData.filter((item) => item.message_id !== event.reminder?.message_id);
        }
        if (isReminderOverdue(existingReminder) && !isReminderOverdue(event.reminder)) {
          return prevData.filter((item) => item.message_id !== event.reminder?.message_id);
        }
        if (isReminderUpcoming(existingReminder) && !isReminderUpcoming(event.reminder)) {
          return prevData.filter((item) => item.message_id !== event.reminder?.message_id);
        }

        return prevData;
      });
    };

    const listeners = [
      client.on('reminder.created', handleReminderCreated),
      client.on('reminder.deleted', handleReminderDeleted),
      client.on('reminder.updated', handleReminderUpdated),
    ];

    return () => {
      listeners.forEach((l) => l.unsubscribe());
    };
  }, [client]);

  const loadNext = useCallback(async () => {
    await client.reminders.queryNextReminders();
  }, [client.reminders]);

  return {
    data,
    isLoading,
    loadNext,
    setData,
  };
};
