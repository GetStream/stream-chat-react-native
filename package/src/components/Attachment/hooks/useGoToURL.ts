import { useState } from 'react';
import { Linking } from 'react-native';

export type UseGoToURLType = (url?: string) => [boolean, () => Promise<void>];

export const useGoToURL: UseGoToURLType = (url?: string) => {
  const [error, setError] = useState<boolean>(false);

  let finalUrl = url as string;
  const pattern = new RegExp(/^\S+:\/\//);

  if (!pattern.test(finalUrl)) {
    finalUrl = 'http://' + url;
  }

  const openURL = () =>
    Linking.canOpenURL(finalUrl).then((supported) => {
      if (supported) {
        Linking.openURL(finalUrl);
      } else {
        setError(true);
        console.log(`Don't know how to open URI: ${finalUrl}`);
      }
    });

  return [error, openURL];
};
