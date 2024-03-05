import { useEffect, useRef, useState } from 'react';

export const useTargetedMessage = (messageId?: string) => {
  const clearTargetedMessageCall = useRef<ReturnType<typeof setTimeout>>();
  const [targetedMessage, setTargetedMessage] = useState(messageId);
  const prevTargetedMessageRef = useRef<string>();

  useEffect(() => {
    prevTargetedMessageRef.current = targetedMessage;
  }, [targetedMessage]);

  useEffect(() => {
    clearTargetedMessageCall.current = setTimeout(() => {
      setTargetedMessage(undefined);
    }, 3000);

    return () => {
      clearTargetedMessageCall.current && clearTimeout(clearTargetedMessageCall.current);
    };
  }, []);

  const setTargetedMessageTimeoutRef = useRef((messageId: string) => {
    clearTargetedMessageCall.current && clearTimeout(clearTargetedMessageCall.current);

    clearTargetedMessageCall.current = setTimeout(() => {
      setTargetedMessage(undefined);
    }, 3000);

    setTargetedMessage(messageId);
  });

  return {
    prevTargetedMessage: prevTargetedMessageRef.current,
    setTargetedMessage: setTargetedMessageTimeoutRef.current,
    targetedMessage,
  };
};
