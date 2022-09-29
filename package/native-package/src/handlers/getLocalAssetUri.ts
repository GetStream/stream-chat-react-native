import { CameraRoll } from '@react-native-camera-roll/camera-roll';

export const getLocalAssetUri = async (remoteUri: string) => {
  try {
    const localUri = await CameraRoll.save(remoteUri);
    return localUri;
  } catch {
    throw new Error('getLocalAssetUri Error');
  }
};
