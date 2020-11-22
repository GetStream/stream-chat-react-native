import { useRef, useState } from 'react';
import { Channel, Message, MessageResponse } from 'stream-chat';
import { useEffect } from 'react';
import { MockDataService } from '../utils/MockDataService';

export const usePaginatedAttachments = (
  channel: Channel,
  attachmentType: string,
) => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);

  const fetchAttachments = async () => {
    if (queryInProgress.current) return;
    setLoading(true);

    try {
      queryInProgress.current = true;

      offset.current = offset.current + messages.length;

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        return;
      }

      // TODO: Use this when support for attachment_type is ready.
      //   const res = await chatClient?.search(
      //     {
      //       id: channel.id,
      //       attachment_type: 'images',
      //     },
      //     '',
      //   );

      const res = await MockDataService.messageSearchByAttachmentType(
        attachmentType,
      );
      const newMessages = res?.results.map((r) => r.message);

      if (!newMessages) {
        queryInProgress.current = false;
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (messages.length < 10) {
        hasMoreResults.current = false;
      }
    } catch (e) {
      // do nothing;
    }
    queryInProgress.current = false;
    setLoading(false);
  };

  const loadMore = () => {
    fetchAttachments();
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  /* eslint-disable sort-keys */
  return {
    loading,
    loadMore,
    messages,
  };
};
