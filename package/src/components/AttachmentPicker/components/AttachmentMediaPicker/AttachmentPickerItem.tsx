import React, { useCallback } from 'react';

import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import {
  AttachmentManagerState,
  FileReference,
  isLocalImageAttachment,
  isLocalVideoAttachment,
  LocalAttachment,
} from 'stream-chat';

import { isIosLimited, type PhotoContentItemType } from './shared';

import { useA11yLabel } from '../../../../a11y/hooks/useA11yLabel';
import { useAttachmentPickerContext } from '../../../../contexts';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { useWindowContentWidth } from '../../../../hooks/useWindowContentWidth';
import { NativeHandlers } from '../../../../native';
import { primitives } from '../../../../theme';
import type { File } from '../../../../types/types';
import { BottomSheetTouchableOpacity } from '../../../BottomSheetCompatibility/BottomSheetTouchableOpacity';
import { VideoAttachmentMetadataPill } from '../../../MessageInput/components/AttachmentPreview/VideoAttachmentUploadPreview';

type AttachmentPickerItemType = {
  asset: File;
};

/**
 * Where this cell's asset sits among the composer's attachments, or -1. Selected per cell, so an
 * upload progressing re-renders no cell and a selection change only the cells whose index moved.
 */
const useSelectedIndex = (isAsset: (attachment: LocalAttachment) => boolean) => {
  const { attachmentManager } = useMessageComposer();
  const selector = useCallback(
    (state: AttachmentManagerState) => ({ selectedIndex: state.attachments.findIndex(isAsset) }),
    [isAsset],
  );
  return useStateStore(attachmentManager.state, selector).selectedIndex;
};

const AttachmentVideo = (props: AttachmentPickerItemType) => {
  const { asset } = props;
  const { numberOfAttachmentPickerImageColumns } = useAttachmentPickerContext();
  const { ImageOverlaySelectedComponent } = useComponentsContext();
  const contentWidth = useWindowContentWidth();
  const { t } = useTranslationContext();
  const { attachmentManager } = useMessageComposer();
  const { uploadNewFile } = useMessageInputContext();
  const isAsset = useCallback(
    (attachment: LocalAttachment) =>
      isLocalVideoAttachment(attachment)
        ? (attachment.localMetadata.file as FileReference).uri === asset.uri
        : false,
    [asset.uri],
  );
  const selectedIndex = useSelectedIndex(isAsset);

  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
    },
  } = useTheme();
  const styles = useStyles();

  const { duration: videoDuration, thumb_url } = asset;

  const size = contentWidth / (numberOfAttachmentPickerImageColumns || 3) - 2;
  const selected = selectedIndex !== -1;
  const accessibilityLabel = useA11yLabel(
    selected
      ? 'attachmentPicker.video.deselect.accessibilityLabel'
      : 'attachmentPicker.video.select.accessibilityLabel',
  );

  const onPressVideo = async () => {
    if (selected) {
      const attachment = attachmentManager.attachments.find(isAsset);
      if (attachment) {
        attachmentManager.removeAttachments([attachment.localMetadata.id]);
      }
    } else {
      if (!attachmentManager.availableUploadSlots) {
        Alert.alert(t('attachmentPicker.maxFiles.error', 'Maximum number of files reached'));
        return;
      }
      await uploadNewFile(asset);
    }
  };

  return (
    <BottomSheetTouchableOpacity
      accessible={accessibilityLabel ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'button' : undefined}
      accessibilityState={accessibilityLabel ? { selected } : undefined}
      onPress={onPressVideo}
      style={[
        {
          height: size,
          margin: 1,
          width: size,
        },
        image,
      ]}
    >
      <Image source={{ uri: thumb_url }} style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, imageOverlay]}>
        <ImageOverlaySelectedComponent index={selectedIndex} />
      </View>
      <VideoAttachmentMetadataPill duration={videoDuration} format='timer' />
    </BottomSheetTouchableOpacity>
  );
};

const AttachmentImage = (props: AttachmentPickerItemType) => {
  const { asset } = props;
  const { numberOfAttachmentPickerImageColumns } = useAttachmentPickerContext();
  const { ImageOverlaySelectedComponent } = useComponentsContext();
  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
    },
  } = useTheme();
  const styles = useStyles();
  const contentWidth = useWindowContentWidth();
  const { t } = useTranslationContext();
  const { uploadNewFile } = useMessageInputContext();
  const { attachmentManager } = useMessageComposer();
  const isAsset = useCallback(
    (attachment: LocalAttachment) =>
      isLocalImageAttachment(attachment)
        ? attachment.localMetadata.previewUri === asset.uri
        : false,
    [asset.uri],
  );
  const selectedIndex = useSelectedIndex(isAsset);

  const size = contentWidth / (numberOfAttachmentPickerImageColumns || 3) - 2;
  const selected = selectedIndex !== -1;
  const accessibilityLabel = useA11yLabel(
    selected
      ? 'attachmentPicker.image.deselect.accessibilityLabel'
      : 'attachmentPicker.image.select.accessibilityLabel',
  );

  const { uri } = asset;

  const onPressImage = async () => {
    if (selected) {
      const attachment = attachmentManager.attachments.find(isAsset);
      if (attachment) {
        await attachmentManager.removeAttachments([attachment.localMetadata.id]);
      }
    } else {
      if (!attachmentManager.availableUploadSlots) {
        Alert.alert(t('attachmentPicker.maxFiles.error', 'Maximum number of files reached'));
        return;
      }
      await uploadNewFile(asset);
    }
  };

  return (
    <BottomSheetTouchableOpacity
      accessible={accessibilityLabel ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'button' : undefined}
      accessibilityState={accessibilityLabel ? { selected } : undefined}
      onPress={onPressImage}
      style={[
        {
          height: size,
          margin: 1,
          width: size,
        },
        image,
      ]}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, imageOverlay]}>
        <ImageOverlaySelectedComponent index={selectedIndex} />
      </View>
    </BottomSheetTouchableOpacity>
  );
};

const AttachmentIosLimited = () => {
  const { numberOfAttachmentPickerImageColumns } = useAttachmentPickerContext();
  const { icons } = useComponentsContext();
  const contentWidth = useWindowContentWidth();
  const { t } = useTranslationContext();
  const size = contentWidth / (numberOfAttachmentPickerImageColumns || 3) - 2;
  const styles = useStyles();
  return (
    <BottomSheetTouchableOpacity
      style={[
        {
          width: size,
          height: size,
        },
        styles.iosLimitedContainer,
      ]}
      onPress={NativeHandlers.iOS14RefreshGallerySelection}
    >
      <icons.Plus width={20} height={20} stroke={styles.iosLimitedIcon.color} strokeWidth={1.5} />
      <Text style={styles.iosLimitedText}>
        {t('attachmentPicker.photoLibrary.addMore.label', 'Add more')}
      </Text>
    </BottomSheetTouchableOpacity>
  );
};

export const renderAttachmentPickerItem = ({ item }: { item: PhotoContentItemType }) => {
  if (isIosLimited(item)) {
    return <AttachmentIosLimited />;
  }
  /**
   * Expo Media Library - Result of asset type
   * Native Android - Gives mime type(Eg: image/jpeg, video/mp4, etc.)
   * Native iOS - Gives `image` or `video`
   * Expo Android/iOS - Gives `photo` or `video`
   **/
  const isVideoType = item.type?.includes('video');

  if (isVideoType) {
    return <AttachmentVideo asset={item} />;
  }

  return <AttachmentImage asset={item} />;
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return StyleSheet.create({
    durationText: {
      fontWeight: 'bold',
    },
    overlay: {
      alignItems: 'flex-end',
      flex: 1,
    },
    videoView: {
      bottom: 5,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
      position: 'absolute',
      width: '100%',
    },
    iosLimitedContainer: {
      margin: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: semantics.backgroundCoreSurfaceCard,
      gap: primitives.spacingXs,
    },
    iosLimitedIcon: {
      color: semantics.textTertiary,
    },
    iosLimitedText: {
      fontWeight: primitives.typographyFontWeightSemiBold,
      fontSize: primitives.typographyFontSizeSm,
      color: semantics.textTertiary,
      textAlign: 'center',
    },
  });
};
