import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import type { EditChannelDetailsState } from '../../../state-store/edit-channel-details-store';
import { primitives } from '../../../theme';
import type { GlobalFileUploadRequest } from '../../../types/types';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { Button } from '../../ui/Button/Button';
import { useEditChannelImage } from '../hooks/useEditChannelImage';

const selector = (state: EditChannelDetailsState) => ({
  pendingAction: state.pendingAction,
  updatedImage: state.updatedImage,
});

export type ChannelEditDetailsProps = {
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality) applied
   * to the channel image picked during editing. Overrides the value resolved
   * from `ChannelDetailsContext`.
   */
  compressImageQuality?: number;
  /**
   * Override the upload request used to upload the channel image. Overrides the
   * value resolved from `ChannelDetailsContext`.
   */
  doFileUploadRequest?: GlobalFileUploadRequest;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditDetails = ({
  compressImageQuality,
  doFileUploadRequest,
}: ChannelEditDetailsProps) => {
  const { channel } = useChannelDetailsContext();
  const { setCompressImageQuality, setDoFileUploadRequest, store } = useChannelEditDetailsContext();
  const { ChannelEditImageSheet, ChannelEditName } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
        editChannel: {
          avatarSection: avatarSectionOverride,
          container: containerOverride,
          uploadButton: uploadButtonOverride,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const { pickImageFromNativePicker, takePhoto } = useEditChannelImage();

  const { pendingAction, updatedImage } = useStateStore(store.state, selector);

  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  // Push the props into the context so the edit flow (image picker, save
  // handler) reads a single source of truth. Only sync when defined to avoid
  // clobbering the value the provider seeded from `ChannelDetailsContext`.
  useEffect(() => {
    if (compressImageQuality !== undefined) setCompressImageQuality?.(compressImageQuality);
  }, [compressImageQuality, setCompressImageQuality]);

  useEffect(() => {
    if (doFileUploadRequest) setDoFileUploadRequest?.(doFileUploadRequest);
  }, [doFileUploadRequest, setDoFileUploadRequest]);

  useEffect(() => {
    if (sheetVisible || !pendingAction) return;
    const action = pendingAction;
    store.setPendingAction(null);
    (async () => {
      if (action === 'camera') {
        const file = await takePhoto();
        if (file) {
          store.setUpdatedImage(file);
        }
      } else if (action === 'library') {
        const file = await pickImageFromNativePicker();
        if (file) {
          store.setUpdatedImage(file);
        }
      } else if (action === 'reset') {
        store.setUpdatedImage(null);
      }
    })();
  }, [pendingAction, pickImageFromNativePicker, sheetVisible, store, takePhoto]);

  // `undefined` = untouched (show live channel image), `File` = picked uri, `null` = reset.
  const isPreview = updatedImage !== undefined;
  const previewUri = updatedImage ? updatedImage.uri : null;

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={[styles.avatarSection, avatarSectionOverride]}>
        <ChannelAvatar
          channel={channel}
          isPreview={isPreview}
          previewUri={previewUri}
          showBorder={false}
          size='2xl'
        />
        <Button
          accessibilityLabelKey='a11y/Upload channel image'
          label={t('Upload')}
          onPress={openSheet}
          size='sm'
          style={[styles.uploadButton, uploadButtonOverride]}
          testID='channel-edit-upload-button'
          type='ghost'
          variant='primary'
        />
      </View>
      <ChannelEditName />
      <ChannelEditImageSheet onClose={closeSheet} visible={sheetVisible} />
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        avatarSection: {
          alignItems: 'center',
          gap: primitives.spacingXs,
        },
        container: {
          flex: 1,
          gap: primitives.spacingXl,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingMd,
        },
        uploadButton: {
          width: 'auto',
        },
      }),
    [],
  );
