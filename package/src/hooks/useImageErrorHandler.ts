import { useEffect, useState } from 'react';

import { useChatContext } from '../contexts/chatContext/ChatContext';

export const useImageErrorHandler = () => {
  const [imageError, setImageError] = useState(false);
  const { isOnline } = useChatContext();

  useEffect(() => {
    if (isOnline && imageError) {
      setImageError(false);
    }
  }, [isOnline]);

  return { imageError, setImageError };
};
