import { useState } from 'react';

export const useLoadingImage = () => {
  const [isLoadingImage, setLoadingImage] = useState(true);
  const [isLoadingImageError, setLoadingImageError] = useState(false);

  return { isLoadingImage, isLoadingImageError, setLoadingImage, setLoadingImageError };
};
