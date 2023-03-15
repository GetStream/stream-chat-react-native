import { useEffect, useReducer, useRef } from 'react';

import { useNetInfo } from '@react-native-community/netinfo';

type ImageState = {
  // this key is used to force a reload of the image when the image fails to load
  imageKey: number;
  isLoadingImage: boolean;
  isLoadingImageError: boolean;
};

type Action =
  | { type: 'reloadImage' }
  | { isLoadingImage: boolean; type: 'setLoadingImage' }
  | { isLoadingImageError: boolean; type: 'setLoadingImageError' };

function reducer(prevState: ImageState, action: Action) {
  switch (action.type) {
    case 'reloadImage':
      return {
        ...prevState,
        imageKey: prevState.imageKey + 1,
        isLoadingImage: true,
        isLoadingImageError: false,
      };
    case 'setLoadingImage':
      return { ...prevState, isLoadingImage: action.isLoadingImage };
    case 'setLoadingImageError':
      return { ...prevState, isLoadingImageError: action.isLoadingImageError };
    default:
      return prevState;
  }
}
export const useLoadingImage = () => {
  const [imageState, dispatch] = useReducer(reducer, {
    imageKey: 0,
    isLoadingImage: true,
    isLoadingImageError: false,
  });
  const { imageKey, isLoadingImage, isLoadingImageError } = imageState;
  const onReloadImageRef = useRef(() => dispatch({ type: 'reloadImage' }));
  const setLoadingImageRef = useRef((isLoadingImage: boolean) =>
    dispatch({ isLoadingImage, type: 'setLoadingImage' }),
  );
  const setLoadingImageErrorRef = useRef((isLoadingImageError: boolean) =>
    dispatch({ isLoadingImageError, type: 'setLoadingImageError' }),
  );
  const { isConnected } = useNetInfo();
  useEffect(() => {
    if (isConnected && isLoadingImageError) {
      // if there was an error previously, reload the image automatically when connection has recovered
      onReloadImageRef.current();
    }
  }, [isConnected, isLoadingImageError]);

  return {
    imageKey,
    isLoadingImage,
    isLoadingImageError,
    onReloadImage: onReloadImageRef.current,
    setLoadingImage: setLoadingImageRef.current,
    setLoadingImageError: setLoadingImageErrorRef.current,
  };
};
