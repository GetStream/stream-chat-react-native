import { useEffect } from 'react';

import type {
  ScheduledMessageResponse,
  ScheduledMessagesView,
  ScheduledMessagesViewState,
} from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const NO_SCHEDULED_MESSAGES: ScheduledMessageResponse[] = [];

const itemsSelector = ({ items }: ScheduledMessagesViewState) => ({ items });

/**
 * The messages of a scheduled-message view, kept following its paginator while mounted. It loads
 * nothing: `useChannelScheduledMessages` and `useScheduledMessageList` load the list too.
 */
export const useScheduledMessages = (view: ScheduledMessagesView) => {
  useEffect(() => {
    view.registerSubscriptions();
    return () => {
      view.unregisterSubscriptions();
    };
  }, [view]);

  const { items } = useStateStore(view.state, itemsSelector);
  return { scheduledMessages: items ?? NO_SCHEDULED_MESSAGES };
};
