import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { resolveDateSeparatorDates } from '../utils/buildMessageListWithNeighbours';

/**
 * Resolves the date separator for every row of the message list, but only when a
 * `getDateSeparators` override is supplied - a whole-list rule can only be answered by walking
 * the whole list.
 *
 * Returns `undefined` for the default rule, which is neighbour-local: each row derives its own
 * separator from the row above it, so the list does no per-change work at all.
 *
 * @param messages the list in render order
 * @param isInverted true when the list is ordered newest -> oldest (`MessageList`), false when it
 * is ordered oldest -> newest (`MessageFlashList`)
 */
export const useDateSeparatorDates = (messages: LocalMessage[], isInverted: boolean) => {
  const { hideDateSeparators } = useChannelContext();
  const { getDateSeparators } = useMessagesContext();

  return useMemo(
    () =>
      getDateSeparators
        ? resolveDateSeparatorDates(messages, {
            getDateSeparators,
            hideDateSeparators,
            isInverted,
          })
        : undefined,
    [messages, getDateSeparators, hideDateSeparators, isInverted],
  );
};
