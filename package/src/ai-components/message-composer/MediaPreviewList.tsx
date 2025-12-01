import { useMediaPickerState } from '../services/media-picker-service/hooks/useMediaPickerState';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Close } from '../internal/icons/Close';
import React, { useMemo } from 'react';
import { useMessageComposerContext, useTheme } from '../contexts';

export const MediaPreviewList = () => {
  const { mediaPickerService } = useMessageComposerContext();
  const { attachments } =
    useMediaPickerState({ service: mediaPickerService }) ?? {};
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
          <Image
            style={[styles.mediaPreviewImage, mediaPreviewImage]}
            source={{ uri: attachment.uri }}
            width={100}
            height={100}
          />
          <Pressable
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
