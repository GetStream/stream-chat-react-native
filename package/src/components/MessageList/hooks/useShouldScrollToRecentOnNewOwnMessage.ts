import { useEffect, useRef } from 'react';

import type { LocalMessage } from 'stream-chat';

export function useShouldScrollToRecentOnNewOwnMessage(
  rawMessageList: LocalMessage[],
  currentUserId?: string,
) {
  const lastFocusedOwnMessageId = useRef('');
  const initialFocusRegistered = useRef(false);
  const messagesRef = useRef(rawMessageList);
  messagesRef.current = rawMessageList;

  const isMyOwnNewMessageRef = useRef(() => {
    if (messagesRef.current && messagesRef.current.length > 0) {
      const lastMessage = messagesRef.current[messagesRef.current.length - 1];

      if (
        lastMessage &&
        lastMessage.user?.id === currentUserId &&
        lastFocusedOwnMessageId.current !== lastMessage.id
      ) {
        lastFocusedOwnMessageId.current = lastMessage.id;
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    if (rawMessageList && rawMessageList.length) {
      if (!initialFocusRegistered.current) {
        initialFocusRegistered.current = true;
        const lastMessage = rawMessageList[0];
        if (lastMessage && lastMessage.user?.id === currentUserId) {
          lastFocusedOwnMessageId.current = lastMessage.id;
        }
      }
    }
  }, [currentUserId, rawMessageList]);

  return isMyOwnNewMessageRef;
}
