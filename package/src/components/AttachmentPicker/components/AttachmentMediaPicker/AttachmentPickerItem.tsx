import React from 'react';

import { Alert, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { FileReference, isLocalImageAttachment, isLocalVideoAttachment } from 'stream-chat';

import { isIosLimited, PhotoContentItemType } from './AttachmentMediaPicker';

import { useAttachmentPickerContext } from '../../../../contexts';
import { useAttachmentManagerState } from '../../../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../../../hooks/useViewport';
import { Plus } from '../../../../icons/Plus';
import { NativeHandlers } from '../../../../native';
import { primitives } from '../../../../theme';
import type { File } from '../../../../types/types';
import { BottomSheetTouchableOpacity } from '../../../BottomSheetCompatibility/BottomSheetTouchableOpacity';
import { VideoAttachmentMetadataPill } from '../../../MessageInput/components/AttachmentPreview/VideoAttachmentUploadPreview';

type AttachmentPickerItemType = {
  asset: File;
};

const AttachmentVideo = (props: AttachmentPickerItemType) => {
  const { asset } = props;
  const { numberOfAttachmentPickerImageColumns, ImageOverlaySelectedComponent } =
    useAttachmentPickerContext();
  const { vw } = useViewport();
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { uploadNewFile } = useMessageInputContext();
  const { attachmentManager } = messageComposer;
  const { attachments, availableUploadSlots } = useAttachmentManagerState();

  const selectedIndex = attachments.findIndex((attachment) =>
    isLocalVideoAttachment(attachment)
      ? (attachment.localMetadata.file as FileReference).uri === asset.uri
      : false,
  );

  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
    },
  } = useTheme();
  const styles = useStyles();

  const { duration: videoDuration, thumb_url } = asset;

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const onPressVideo = async () => {
    if (selectedIndex !== -1) {
      const attachment = attachments[selectedIndex];
      if (attachment) {
        attachmentManager.removeAttachments([attachment.localMetadata.id]);
      }
    } else {
      if (!availableUploadSlots) {
        Alert.alert(t('Maximum number of files reached'));
        return;
      }
      await uploadNewFile(asset);
    }
  };

  return (
    <BottomSheetTouchableOpacity onPress={onPressVideo}>
      <ImageBackground
        source={{ uri: thumb_url }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        <View style={[styles.overlay, imageOverlay]}>
          <ImageOverlaySelectedComponent index={selectedIndex} />
        </View>
        <VideoAttachmentMetadataPill duration={videoDuration} format='timer' />
      </ImageBackground>
    </BottomSheetTouchableOpacity>
  );
};

const AttachmentImage = (props: AttachmentPickerItemType) => {
  const { asset } = props;
  const { numberOfAttachmentPickerImageColumns, ImageOverlaySelectedComponent } =
    useAttachmentPickerContext();
  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
    },
  } = useTheme();
  const styles = useStyles();
  const { vw } = useViewport();
  const { uploadNewFile } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { attachmentManager } = messageComposer;
  const { attachments, availableUploadSlots } = useAttachmentManagerState();
  const selectedIndex = attachments.findIndex((attachment) =>
    isLocalImageAttachment(attachment) ? attachment.localMetadata.previewUri === asset.uri : false,
  );

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const { uri } = asset;

  const onPressImage = async () => {
    if (selectedIndex !== -1) {
      const attachment = attachments[selectedIndex];
      if (attachment) {
        await attachmentManager.removeAttachments([attachment.localMetadata.id]);
      }
    } else {
      if (!availableUploadSlots) {
        Alert.alert('Maximum number of files reached');
        return;
      }
      await uploadNewFile(asset);
    }
  };

  return (
    <BottomSheetTouchableOpacity onPress={onPressImage}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        <View style={[styles.overlay, imageOverlay]}>
          <ImageOverlaySelectedComponent index={selectedIndex} />
        </View>
      </ImageBackground>
    </BottomSheetTouchableOpacity>
  );
};

const AttachmentIosLimited = () => {
  const { numberOfAttachmentPickerImageColumns } = useAttachmentPickerContext();
  const { vw } = useViewport();
  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;
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
      <Plus width={20} height={20} stroke={styles.iosLimitedIcon.color} strokeWidth={1.5} />
      <Text style={styles.iosLimitedText}>Add more</Text>
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
      backgroundColor: semantics.backgroundCoreSurfaceSubtle,
    },
    iosLimitedIcon: {
      color: semantics.textTertiary,
    },
    iosLimitedText: {
      fontWeight: primitives.typographyFontWeightSemiBold,
      fontSize: primitives.typographyFontSizeSm,
      color: semantics.textTertiary,
    },
  });
};
