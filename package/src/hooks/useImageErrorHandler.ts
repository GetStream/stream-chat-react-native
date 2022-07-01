import { useEffect, useState } from 'react';

import { useNetInfo } from '@react-native-community/netinfo';

export const useImageErrorHandler = () => {
  const [imageError, setImageError] = useState(false);
  const { isConnected } = useNetInfo();

  useEffect(() => {
    if (isConnected && imageError) {
      setImageError(false);
    }
  }, [isConnected]);

  return { imageError, setImageError };
};
