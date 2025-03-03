import { useEffect, useRef, useState } from 'react';

export const useTargetedMessage = (messageId?: string) => {
  const clearTargetedMessageCall = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [targetedMessage, setTargetedMessage] = useState<string | undefined>(messageId);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>();
  const prevTargetedMessageRef = useRef<string>(undefined);

  useEffect(() => {
    prevTargetedMessageRef.current = targetedMessage;
    if (targetedMessage) {
      setHighlightedMessageId(targetedMessage);
    }
  }, [targetedMessage]);

  useEffect(() => {
    clearTargetedMessageCall.current = setTimeout(() => {
      setTargetedMessage(undefined);
      setHighlightedMessageId(undefined);
    }, 3000);

    return () => {
      clearTargetedMessageCall.current && clearTimeout(clearTargetedMessageCall.current);
    };
  }, []);

  const setTargetedMessageTimeoutRef = useRef((messageId: string | undefined) => {
    clearTargetedMessageCall.current && clearTimeout(clearTargetedMessageCall.current);

    clearTargetedMessageCall.current = setTimeout(() => {
      setTargetedMessage(undefined);
      setHighlightedMessageId(undefined);
    }, 3000);

    setTargetedMessage(messageId);
  });

  return {
    highlightedMessageId,
    prevTargetedMessage: prevTargetedMessageRef.current,
    setTargetedMessage: setTargetedMessageTimeoutRef.current,
    targetedMessage,
  };
};
