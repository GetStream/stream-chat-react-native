import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { primitives } from '../../../theme';
import type { File } from '../../../types/types';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
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
  const { ChannelEditImageSheet } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        editChannel: {
          avatarSection: avatarSectionOverride,
          container: containerOverride,
          nameInput: nameInputOverride,
          uploadButton: uploadButtonOverride,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const { pickImageFromNativePicker, takePhoto } = useEditChannelImage();

  const initialName = (channel.data?.name as string | undefined) ?? '';
  const [name, setName] = useState(initialName);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const stableOnNameChange = useStableCallback(onNameChange);
  const stableOnImagePicked = useStableCallback(onImagePicked);
  const stableOnImageReset = useStableCallback(onImageReset ?? (() => undefined));
  const lastNameRef = useRef(name);
  useEffect(() => {
    if (lastNameRef.current === name) return;
    lastNameRef.current = name;
    stableOnNameChange(name);
  }, [name, stableOnNameChange]);

  const openSheet = useStableCallback(() => setSheetVisible(true));
  const closeSheet = useStableCallback(() => setSheetVisible(false));

  const handleSelectCamera = useStableCallback(() => setPendingAction('camera'));
  const handleSelectLibrary = useStableCallback(() => setPendingAction('library'));
  const handleSelectReset = useStableCallback(() => setPendingAction('reset'));

  useEffect(() => {
    if (sheetVisible || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    (async () => {
      if (action === 'camera') {
        const file = await takePhoto();
        if (file) stableOnImagePicked(file);
      } else if (action === 'library') {
        const file = await pickImageFromNativePicker();
        if (file) stableOnImagePicked(file);
      } else if (action === 'reset') {
        stableOnImageReset();
      }
    })();
  }, [
    pendingAction,
    pickImageFromNativePicker,
    sheetVisible,
    stableOnImagePicked,
    stableOnImageReset,
    takePhoto,
  ]);

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={[styles.avatarSection, avatarSectionOverride]}>
        <ChannelAvatar channel={channel} showBorder={false} size='2xl' />
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
      <Input
        accessibilityLabel={t('a11y/Channel name')}
        autoCapitalize='words'
        autoCorrect={false}
        containerStyle={nameInputOverride}
        helperText={false}
        onChangeText={setName}
        placeholder={t('Channel name')}
        returnKeyType='done'
        testID='channel-edit-name-input'
        value={name}
        variant='outline'
      />
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
