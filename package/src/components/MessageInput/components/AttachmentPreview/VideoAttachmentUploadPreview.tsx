import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { LocalImageAttachment, LocalVideoAttachment } from 'stream-chat';

import { FileAttachmentUploadPreview } from './FileAttachmentUploadPreview';
import { ImageAttachmentUploadPreview } from './ImageAttachmentUploadPreview';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../../icons';
import { primitives } from '../../../../theme';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { formatMsToMinSec } from '../../../../utils/utils';

export type VideoAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVideoAttachment<CustomLocalMetadata>>;

export const VideoAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: VideoAttachmentUploadPreviewProps) => {
  const styles = useStyles();

  const durationLabel = useMemo(
    () => (attachment.duration ? formatMsToMinSec(attachment.duration) : undefined),
    [attachment.duration],
  );

  return attachment.localMetadata.previewUri ? (
    <>
      <ImageAttachmentUploadPreview
        attachment={attachment as unknown as LocalImageAttachment}
        handleRetry={handleRetry}
        removeAttachments={removeAttachments}
      />
      {durationLabel ? (
        <View style={styles.durationContainer}>
          <Recorder height={12} width={12} pathFill={styles.durationText.color} />
          <Text style={styles.durationText}>{durationLabel}</Text>
        </View>
      ) : null}
    </>
  ) : (
    <FileAttachmentUploadPreview
      attachment={attachment}
      handleRetry={handleRetry}
      removeAttachments={removeAttachments}
    />
  );
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

  const { badgeBgInverse, badgeText } = semantics;

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
          color: badgeText,
          marginLeft: primitives.spacingXxs,
          ...durationText,
        },
      }),
    [badgeBgInverse, badgeText, durationContainer, durationText],
  );
};
