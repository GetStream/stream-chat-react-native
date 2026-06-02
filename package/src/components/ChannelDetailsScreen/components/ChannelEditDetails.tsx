import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import type { File } from '../../../types/types';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { Button } from '../../ui/Button/Button';
import { useEditChannelImage } from '../hooks/useEditChannelImage';

type PendingAction = 'camera' | 'library' | 'reset';

export type ChannelEditDetailsProps = {
  /**
   * Fires whenever the user picks a new channel image (via camera or gallery).
   * The parent owns the resulting `File` and decides when/how to upload it —
   * the picker flow itself does not upload anything.
   */
  onImagePicked: (file: File) => void;
  /**
   * Optional. Fires when the user picks "Reset Picture" from the edit-picture
   * sheet. When omitted, the destructive Reset row is hidden from the sheet.
   */
  onImageReset?: () => void;
  /**
   * Fires whenever the channel name input changes. Parent components use this to
   * track the current value so they can enable/disable a save action and read
   * the value when committing the update.
   */
  onNameChange: (name: string) => void;
};

export const ChannelEditDetails = ({
  onImagePicked,
  onImageReset,
  onNameChange,
}: ChannelEditDetailsProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelEditImageSheet, ChannelEditName } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
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

  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // `undefined` = untouched (show live channel image), `string` = picked uri, `null` = reset.
  const [previewUri, setPreviewUri] = useState<string | null | undefined>(undefined);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  const handleSelectCamera = useCallback(() => setPendingAction('camera'), []);
  const handleSelectLibrary = useCallback(() => setPendingAction('library'), []);
  const handleSelectReset = useCallback(() => setPendingAction('reset'), []);

  useEffect(() => {
    if (sheetVisible || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    (async () => {
      if (action === 'camera') {
        const file = await takePhoto();
        if (file) {
          setPreviewUri(file.uri);
          onImagePicked(file);
        }
      } else if (action === 'library') {
        const file = await pickImageFromNativePicker();
        if (file) {
          setPreviewUri(file.uri);
          onImagePicked(file);
        }
      } else if (action === 'reset') {
        setPreviewUri(null);
        onImageReset?.();
      }
    })();
  }, [
    onImagePicked,
    onImageReset,
    pendingAction,
    pickImageFromNativePicker,
    sheetVisible,
    takePhoto,
  ]);

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={[styles.avatarSection, avatarSectionOverride]}>
        <ChannelAvatar
          channel={channel}
          isPreview={previewUri !== undefined}
          previewUri={previewUri ?? null}
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
      <ChannelEditName onNameChange={onNameChange} />
      <ChannelEditImageSheet
        onClose={closeSheet}
        onSelectCamera={handleSelectCamera}
        onSelectLibrary={handleSelectLibrary}
        onSelectReset={onImageReset ? handleSelectReset : undefined}
        visible={sheetVisible}
      />
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
