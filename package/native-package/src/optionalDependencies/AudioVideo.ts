import { StyleProp, ViewStyle } from 'react-native';

let AudioVideoComponent:
  | React.ComponentType<{
      onBuffer: () => void;
      onEnd: () => void;
      onError: (error: Error) => void;
      onLoad: () => void;
      onProgress: () => void;
      paused: boolean;
      ref: React.RefObject<any>;
      source: {
        uri: string;
      };
      style: StyleProp<ViewStyle>;
      audioOnly?: boolean;
      ignoreSilentSwitch?: 'ignore' | 'obey';
      repeat?: boolean;
    }>
  | undefined;
try {
  // eslint-disable-next-line no-undef
  const videoPackage = require('react-native-video');
  AudioVideoComponent = videoPackage.default;
} catch (_) {
  console.warn(
    'Video library is currently not installed. To allow in-app video playback, install the "react-native-video" package.',
  );
}

export default AudioVideoComponent;
