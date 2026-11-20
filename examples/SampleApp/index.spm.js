// Entry point of the Swift Package Manager smoke build (STREAM_CHAT_SPM_ONLY=1, see
// react-native.config.js). That build links the SDK's native module and nothing else, so this
// screen only touches the SDK's own native modules and view, not the chat UI.
import React, { useEffect, useState } from 'react';
import { AppRegistry, StyleSheet, Text, TurboModuleRegistry, View } from 'react-native';

import StreamShimmerView from 'stream-chat-react-native/src/native/StreamShimmerViewNativeComponent';

import { name as appName } from './app.json';

const MODULES = [
  'StreamChatReactNative',
  'StreamVideoThumbnail',
  'StreamMultipartUploader',
  'AIAgent',
  'AIDictation',
];

const SpmSmokeTest = () => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const linked = MODULES.map(
      (name) => `${name}: ${TurboModuleRegistry.get(name) ? 'linked' : 'missing'}`,
    );
    setLines(linked);
    // A call that crosses from the Objective-C++ module into its Swift implementation.
    TurboModuleRegistry.get('StreamVideoThumbnail')
      ?.createVideoThumbnails(['file:///spm-smoke-test.mp4'])
      .then((results) => setLines([...linked, `video thumbnails: ${JSON.stringify(results)}`]))
      .catch((error) => setLines([...linked, `video thumbnails failed: ${error.message}`]));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Stream Chat Swift Package Manager smoke test</Text>
      {lines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
      <StreamShimmerView baseColor='#d0d0d0' gradientColor='#ffffff' style={styles.shimmer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 80 },
  shimmer: { backgroundColor: '#e8e8e8', height: 80, marginTop: 16 },
});

AppRegistry.registerComponent(appName, () => SpmSmokeTest);
