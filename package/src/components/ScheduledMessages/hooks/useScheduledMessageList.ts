import { useEffect } from 'react';

import type {
  PaginatorState,
  ScheduledMessageResponse,
  ScheduledMessagesView,
  ScheduledMessagesViewState,
} from 'stream-chat';

import { useScheduledMessages } from './useScheduledMessages';

import { useStableCallback } from '../../../hooks/useStableCallback';
import { useStateStore } from '../../../hooks/useStateStore';

const paginatorSelector = ({
  hasMoreTail,
  isLoading,
  lastQueryError,
}: PaginatorState<ScheduledMessageResponse>) => ({
  error: lastQueryError,
  hasMoreTail,
  isLoading,
});

const itemsSelector = ({ items }: ScheduledMessagesViewState) => ({ items });

/**
 * A view's messages for a list screen, with its paginator's loading state. Loads the first page if
 * it has not been loaded. `items` stays `undefined` until then, for the loading state.
 */
export const useScheduledMessageList = (view: ScheduledMessagesView) => {
  const { paginator } = view;
  const { error, hasMoreTail, isLoading } = useStateStore(paginator.state, paginatorSelector);
  // keeps the view following its paginator while the list is shown
  useScheduledMessages(view);
  const { items } = useStateStore(view.state, itemsSelector);

  useEffect(() => {
    if (paginator.hasLoadedPage || paginator.isLoading) return;
    paginator.reload().catch(() => undefined);
  }, [paginator]);

  const loadMore = useStableCallback(() => {
    if (!hasMoreTail || isLoading) return;
    paginator.toTail().catch(() => undefined);
  });

  const reload = useStableCallback(() => {
    paginator.reload().catch(() => undefined);
  });

  return { error, hasMoreTail, isLoading, items, loadMore, reload };
};
