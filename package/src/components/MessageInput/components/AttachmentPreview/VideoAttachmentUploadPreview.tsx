import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { LocalImageAttachment, LocalVideoAttachment } from 'stream-chat';

import { FileAttachmentUploadPreview } from './FileAttachmentUploadPreview';
import { ImageAttachmentUploadPreview } from './ImageAttachmentUploadPreview';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../../icons';
import { primitives } from '../../../../theme';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { formatMsToMinSec, getDurationLabelFromDuration } from '../../../../utils/utils';

export type VideoAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVideoAttachment<CustomLocalMetadata>>;

export const VideoAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: VideoAttachmentUploadPreviewProps) => {
  return attachment.localMetadata.previewUri ? (
    <>
      <ImageAttachmentUploadPreview
        attachment={attachment as unknown as LocalImageAttachment}
        handleRetry={handleRetry}
        removeAttachments={removeAttachments}
      />
      <VideoAttachmentMetadataPill duration={attachment.duration} format={'descriptive'} />
    </>
  ) : (
    <FileAttachmentUploadPreview
      attachment={attachment}
      handleRetry={handleRetry}
      removeAttachments={removeAttachments}
    />
  );
};

export const VideoAttachmentMetadataPill = ({
  duration,
  format = 'timer',
}: {
  duration?: number;
  format?: 'descriptive' | 'timer';
}) => {
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();

  const durationLabel = useMemo(() => {
    if (!duration) {
      return undefined;
    }

    if (format === 'timer') {
      return getDurationLabelFromDuration(duration);
    }

    return formatMsToMinSec(duration);
  }, [duration, format]);

  return durationLabel ? (
    <View style={styles.durationContainer}>
      <Recorder height={12} width={12} pathFill={semantics.textInverse} />
      <Text style={styles.durationText}>{durationLabel}</Text>
    </View>
  ) : null;
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageInput: {
        videoAttachmentUploadPreview: { durationContainer, durationText },
      },
    },
  } = useTheme();

  const { badgeBgInverse, textInverse } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        durationContainer: {
          position: 'absolute',
          left: 8,
          bottom: 8,
          borderRadius: primitives.radiusMax,
          backgroundColor: badgeBgInverse,
          paddingVertical: primitives.spacingXxs,
          paddingHorizontal: primitives.spacingXs,
          flexDirection: 'row',
          alignItems: 'center',
          ...durationContainer,
        },
        durationText: {
          fontSize: primitives.typographyFontSizeXxs,
          fontWeight: primitives.typographyFontWeightBold,
          color: textInverse,
          marginLeft: primitives.spacingXxs,
          ...durationText,
        },
      }),
    [badgeBgInverse, textInverse, durationContainer, durationText],
  );
};
