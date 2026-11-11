import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useAITranslation, useMessageComposerContext, useTheme } from '../contexts';
import { Close } from '../internal/icons/Close';
import { AIMessageAttachment } from '../message/AIMessageAttachment';
import type { MediaAsset } from '../services/media-picker-service/AbstractMediaPickerService';
import { useMediaPickerState } from '../services/media-picker-service/hooks/useMediaPickerState';

// An asset without a type is a photo, as the pickers give them.
const isImage = (asset: MediaAsset) => !asset.type || asset.type.startsWith('image');

export const MediaPreviewList = () => {
  const { t } = useAITranslation();
  const { mediaPickerService } = useMessageComposerContext();
  const { attachments } = useMediaPickerState({ service: mediaPickerService }) ?? {};
  const {
    theme: {
      colors: { white },
      composer: {
        mediaPreviewStyle,
        mediaPreviewContentContainerStyle,
        mediaPreviewImage,
        mediaPreviewRemoveButton,
      },
    },
  } = useTheme();
  const styles = useStyles();

  if (!attachments?.length) {
    return null;
  }

  return (
    <ScrollView
      style={[styles.mediaPreviewStyle, mediaPreviewStyle]}
      contentContainerStyle={[
        styles.mediaPreviewContentContainerStyle,
        mediaPreviewContentContainerStyle,
      ]}
      horizontal={true}
    >
      {(attachments ?? []).map((attachment, index) => (
        <Animated.View
          key={attachment.uri}
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(150)}
        >
          {isImage(attachment) ? (
            <Image
              style={[styles.mediaPreviewImage, mediaPreviewImage]}
              source={{ uri: attachment.uri }}
              width={100}
              height={100}
            />
          ) : (
            // Anything else, such as a video, can't show in an `Image`, so it shows as a file.
            <View style={styles.mediaPreviewFile}>
              <AIMessageAttachment
                attachment={{
                  kind: 'file',
                  mimeType: attachment.type,
                  name: attachment.name,
                  size: attachment.size,
                  url: attachment.uri,
                }}
                role='user'
              />
            </View>
          )}
          <Pressable
            accessibilityLabel={t(
              'aiComponents.attachmentPreview.removeAttachment.accessibilityLabel',
              'Remove attachment',
            )}
            accessibilityRole='button'
            hitSlop={8}
            style={[styles.mediaPreviewRemoveButton, mediaPreviewRemoveButton]}
            onPress={() => mediaPickerService?.removeAsset(index)}
          >
            <Close pathFill={white} />
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        mediaPreviewStyle: {
          width: '100%',
        },
        mediaPreviewContentContainerStyle: { flexGrow: 1, paddingBottom: 8 },
        mediaPreviewImage: { borderRadius: 12, marginRight: 8 },
        mediaPreviewFile: { height: 100, justifyContent: 'center', marginRight: 8, width: 220 },
        mediaPreviewRemoveButton: {
          position: 'absolute',
          top: 8,
          right: 12,
          backgroundColor: theme.colors.overlay,
          borderRadius: 24,
        },
      }),
    [theme],
  );
};
