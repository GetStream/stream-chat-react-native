let CameraRollDependency;

try {
  CameraRollDependency = require('@react-native-camera-roll/camera-roll');
} catch (e) {
  // do nothing
  console.log(
    '@react-native-camera-roll/camera-roll is not installed. Please install it or you can choose to install react-native-image-crop-picker for native image picker.',
  );
}

export const getLocalAssetUri = CameraRollDependency
  ? async (remoteUri: string) => {
      try {
        const localUri = await CameraRollDependency.CameraRoll.save(remoteUri);
        return localUri;
      } catch {
        throw new Error('getLocalAssetUri Error');
      }
    }
  : null;
