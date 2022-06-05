import { Linking } from 'react-native';

export const openUrlSafely = async (url?: string) => {
  let finalUrl = url as string;
  const pattern = new RegExp(/^\S+:\/\//);

  if (!pattern.test(finalUrl)) {
    finalUrl = 'http://' + url;
  }
  const supported = await Linking.canOpenURL(finalUrl);

  if (supported) {
    Linking.openURL(finalUrl);
  } else {
    console.warn(`Don't know how to open URI: ${finalUrl}`);
  }
};
