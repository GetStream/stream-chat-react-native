import { useEffect, useReducer, useRef } from 'react';

import { useChatContext } from '../contexts/chatContext/ChatContext';

type ImageState = {
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
      if (prevState.isLoadingImage && !prevState.isLoadingImageError) {
        return prevState;
      }
      return {
        ...prevState,
        isLoadingImage: true,
        isLoadingImageError: false,
      };
    case 'setLoadingImage':
      if (prevState.isLoadingImage === action.isLoadingImage) {
        return prevState;
      }
      return { ...prevState, isLoadingImage: action.isLoadingImage };
    case 'setLoadingImageError':
      if (prevState.isLoadingImageError === action.isLoadingImageError) {
        return prevState;
      }
      return { ...prevState, isLoadingImageError: action.isLoadingImageError };
    default:
      return prevState;
  }
}
export const useLoadingImage = () => {
  const [imageState, dispatch] = useReducer(reducer, {
    isLoadingImage: false,
    isLoadingImageError: false,
  });
  const { isLoadingImage, isLoadingImageError } = imageState;
  const onReloadImageRef = useRef(() => dispatch({ type: 'reloadImage' }));
  const setLoadingImageRef = useRef((isLoadingImage: boolean) =>
    dispatch({ isLoadingImage, type: 'setLoadingImage' }),
  );
  const setLoadingImageErrorRef = useRef((isLoadingImageError: boolean) =>
    dispatch({ isLoadingImageError, type: 'setLoadingImageError' }),
  );
  const { isOnline } = useChatContext();

  // storing the value of isLoadingImageError in a ref to avoid passing as a dep to useEffect
  const hasImageLoadedErroredRef = useRef(isLoadingImageError);
  hasImageLoadedErroredRef.current = isLoadingImageError;

  useEffect(() => {
    if (isOnline && hasImageLoadedErroredRef.current) {
      // if there was an error previously, reload the image automatically when user comes back online
      onReloadImageRef.current();
    }
  }, [isOnline]);

  return {
    isLoadingImage,
    isLoadingImageError,
    onReloadImage: onReloadImageRef.current,
    setLoadingImage: setLoadingImageRef.current,
    setLoadingImageError: setLoadingImageErrorRef.current,
  };
};
