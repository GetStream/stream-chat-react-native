import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { NativeHandlers } from '../../../native';
import type { File } from '../../../types/types';
import { compressedImageURI } from '../../../utils/compressImage';

export type UseEditChannelImageResult = {
  /**
   * Open the device's native image picker and return a single picked image
   * with the compression configured on `ChannelDetails` already applied
   * to its `uri`. Returns `undefined` if the user cancels or denies access.
   */
  pickImageFromNativePicker: () => Promise<File | undefined>;
  /**
   * Launch the device's camera and return the captured image. Returns
   * `undefined` if the user cancels or denies access. The native camera
   * handler already honors `compressImageQuality`, so no extra compression
   * pass is needed for camera files.
   */
  takePhoto: () => Promise<File | undefined>;
};

/**
 * Hook that exposes the two image-acquisition flows used by the channel edit
 * screen — camera capture and native gallery pick — using the same control
 * flow and compression behavior as the message composer (`takeAndUploadImage`
 * and `pickAndUploadImageFromNativePicker` in `MessageInputContext`). The
 * hook intentionally does NOT upload the picked file; the consumer receives a
 * `File` and decides what to do with it.
 *
 * Reads `compressImageQuality` from `ChannelDetailsContext`.
 * @experimental This hook is experimental and is subject to change.
 */
export const useEditChannelImage = (): UseEditChannelImageResult => {
  const { compressImageQuality } = useChannelDetailsContext();
  const { t } = useTranslationContext();

  const takePhoto = useCallback(async (): Promise<File | undefined> => {
    const file = await NativeHandlers.takePhoto({
      compressImageQuality: compressImageQuality ?? 1,
      mediaType: 'image',
    });

    if (file.askToOpenSettings) {
      Alert.alert(
        t('Allow camera access in device settings'),
        t('Device camera is used to take photos or videos.'),
        [
          { style: 'cancel', text: t('Cancel') },
          { onPress: () => Linking.openSettings(), style: 'default', text: t('Open Settings') },
        ],
      );
      return undefined;
    }

    if (file.cancelled) {
      return undefined;
    }

    return file;
  }, [compressImageQuality, t]);

  const pickImageFromNativePicker = useCallback(async (): Promise<File | undefined> => {
    const result = await NativeHandlers.pickImage({ maxNumberOfFiles: 1 });

    if (result.askToOpenSettings) {
      Alert.alert(
        t('Allow access to your Gallery'),
        t('Device gallery permissions is used to take photos or videos.'),
        [
          { style: 'cancel', text: t('Cancel') },
          { onPress: () => Linking.openSettings(), style: 'default', text: t('Open Settings') },
        ],
      );
      return undefined;
    }

    if (result.cancelled || !result.assets?.length) {
      return undefined;
    }

    const asset = result.assets[0];
    const compressedUri = await compressedImageURI(asset, compressImageQuality);
    return { ...asset, uri: compressedUri };
  }, [compressImageQuality, t]);

  return { pickImageFromNativePicker, takePhoto };
};
