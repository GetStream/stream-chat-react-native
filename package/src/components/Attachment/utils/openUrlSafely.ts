import { Linking } from 'react-native';

export const openUrlSafely = (url?: string) => {
  let finalUrl = url as string;
  const pattern = new RegExp(/^\S+:\/\//);

  if (!pattern.test(finalUrl)) {
    finalUrl = 'http://' + url;
  }

  Linking.canOpenURL(finalUrl).then((supported) => {
    if (supported) {
      Linking.openURL(finalUrl);
    } else {
      console.warn(`Don't know how to open URI: ${finalUrl}`);
    }
  });
};
