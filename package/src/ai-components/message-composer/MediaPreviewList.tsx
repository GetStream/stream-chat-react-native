import type { AbstractMediaPickerService } from '../services/media-picker-service/AbstractMediaPickerService';
import { useMediaPickerState } from '../services/media-picker-service/hooks/useMediaPickerState';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Close } from '../internal/icons/Close';
import React from 'react';

export const MediaPreviewList = ({
  mediaPickerService,
}: {
  mediaPickerService?: AbstractMediaPickerService;
}) => {
  const { attachments } =
    useMediaPickerState({ service: mediaPickerService }) ?? {};

  if (!attachments?.length) {
    return null;
  }

  return (
    <ScrollView
      style={styles.mediaPreviewStyle}
      contentContainerStyle={styles.mediaPreviewContentContainerStyle}
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
            style={styles.mediaPreviewImage}
            source={{ uri: attachment.uri }}
            width={100}
            height={100}
          />
          <Pressable
            style={styles.mediaPreviewRemoveButton}
            onPress={() => mediaPickerService?.removeAsset(index)}
          >
            <Close pathFill={'white'} />
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mediaPreviewStyle: {
    width: '100%',
  },
  mediaPreviewContentContainerStyle: { flexGrow: 1, paddingBottom: 8 },
  mediaPreviewImage: { borderRadius: 12, marginRight: 8 },
  mediaPreviewRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: '#000000CC',
    borderRadius: 24,
  },
});
