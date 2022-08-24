import { useEffect, useState } from 'react';

import { useNetInfo } from '@react-native-community/netinfo';

export const useLoadingImage = () => {
  const [isLoadingImage, setLoadingImage] = useState(true);
  const [isLoadingImageError, setLoadingImageError] = useState(false);
  const { isConnected } = useNetInfo();
  useEffect(() => {
    if (isConnected) {
      setLoadingImageError(false);
    }
  }, [isConnected]);

  return { isLoadingImage, isLoadingImageError, setLoadingImage, setLoadingImageError };
};
