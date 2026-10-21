import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';

import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { NativeHandlers } from '../../../native';
import type { File } from '../../../types/types';
import { compressedImageURI } from '../../../utils/compressImage';

export type UseEditChannelImageResult = {
  /**
   * Opens the native image picker and resolves to the picked image, with `compressImageQuality`
   * applied to its `uri`, or `undefined` when the user cancels or denies access.
   */
  pickImageFromNativePicker: () => Promise<File | undefined>;
  /**
   * Opens the camera and resolves to the captured image, or `undefined` when the user cancels or
   * denies access. The native camera handler applies `compressImageQuality` itself.
   */
  takePhoto: () => Promise<File | undefined>;
};

/**
 * The image acquisition flows of the channel edit screen: camera capture and native gallery pick.
 * Neither uploads the file; the caller receives it. Reads `compressImageQuality` from
 * `ChannelEditDetailsContext`.
 *
 * @returns The `takePhoto` and `pickImageFromNativePicker` functions.
 */
export const useEditChannelImage = (): UseEditChannelImageResult => {
  const { compressImageQuality } = useChannelEditDetailsContext();
  const { t } = useTranslationContext();

  const takePhoto = useCallback(async (): Promise<File | undefined> => {
    const file = await NativeHandlers.takePhoto({
      compressImageQuality: compressImageQuality ?? 1,
      mediaType: 'image',
    });

    if (file.askToOpenSettings) {
      Alert.alert(
        t('common.cameraPermission.title', 'Allow camera access in device settings'),
        t(
          'channelDetails.editImageSheet.cameraPermission.text',
          'The camera is used to take the channel image.',
        ),
        [
          { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
          {
            onPress: () => Linking.openSettings(),
            style: 'default',
            text: t('common.openSettings.label', 'Open Settings'),
          },
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
        t('common.galleryPermission.title', 'Allow access to your Gallery'),
        t(
          'channelDetails.editImageSheet.galleryPermission.text',
          'Gallery access is used to choose the channel image.',
        ),
        [
          { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
          {
            onPress: () => Linking.openSettings(),
            style: 'default',
            text: t('common.openSettings.label', 'Open Settings'),
          },
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
