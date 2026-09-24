import { Linking } from 'react-native';

export const openUrlSafely = async (url?: string) => {
  // An attachment whose upload hasn't settled yet has no remote URL. Without this guard the
  // scheme fallback below would turn it into `http://undefined`, which `canOpenURL` accepts.
  if (!url) {
    return;
  }

  let finalUrl = url;
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
