import { useEffect, useRef, useState } from 'react';

export const useTargettedMessage = (messageId?: string) => {
  const clearTargettedMessageCall = useRef<null | NodeJS.Timeout>(null);
  const [targettedMessage, setTargettedMessage] = useState<undefined | string>(
    messageId,
  );

  useEffect(() => {
    clearTargettedMessageCall.current = setTimeout(() => {
      setTargettedMessage(undefined);
    }, 3000);
  }, []);

  // eslint-disable-next-line no-underscore-dangle
  const _setTargettedMessage = (messageId: string) => {
    clearTargettedMessageCall.current &&
      clearTimeout(clearTargettedMessageCall.current);

    clearTargettedMessageCall.current = setTimeout(() => {
      setTargettedMessage(undefined);
    }, 3000);

    setTargettedMessage(messageId);
  };

  return {
    setTargettedMessage: _setTargettedMessage,
    targettedMessage,
  };
};
