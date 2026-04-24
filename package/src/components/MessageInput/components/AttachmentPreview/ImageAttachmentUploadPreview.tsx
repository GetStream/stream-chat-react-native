import React, { useCallback, useMemo, useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { LocalImageAttachment } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentRemoveControl';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

const IMAGE_PREVIEW_SIZE = 72;

export type ImageAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalImageAttachment<CustomLocalMetadata>>;

export const ImageAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentUploadPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const { allowSendBeforeAttachmentsUpload } = useMessageInputContext();
  const {
    ImageLoadingIndicator,
    ImageUploadInProgressIndicator,
    ImageUploadRetryIndicator,
    ImageUploadNotSupportedIndicator,
  } = useComponentsContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    !!allowSendBeforeAttachmentsUpload,
  );
  const previewUri = attachment.localMetadata.previewUri ?? attachment.image_url;
  const shouldShowImageLoadingIndicator =
    loading && indicatorType !== ProgressIndicatorTypes.IN_PROGRESS;

  const {
    theme: {
      messageComposer: {
        imageAttachmentUploadPreview: { upload, wrapper },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  const onLoadEndHandler = useCallback(() => {
    setLoading(false);
  }, []);

  const onErrorHandler = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <View style={[styles.wrapper, wrapper]} testID={'image-attachment-upload-preview'}>
      <View style={[styles.image, upload]}>
        <Image
          onError={onErrorHandler}
          onLoadEnd={onLoadEndHandler}
          source={{ uri: previewUri }}
          style={StyleSheet.absoluteFill}
          testID={'image-attachment-upload-preview-image'}
        />
        {shouldShowImageLoadingIndicator ? <ImageLoadingIndicator /> : null}
        {indicatorType === ProgressIndicatorTypes.IN_PROGRESS && (
          <ImageUploadInProgressIndicator
            localId={attachment.localMetadata.id}
            sourceUrl={previewUri}
          />
        )}
        {!loading && indicatorType === ProgressIndicatorTypes.RETRY && (
          <ImageUploadRetryIndicator onRetryHandler={onRetryHandler} />
        )}
        {!loading && indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED && (
          <ImageUploadNotSupportedIndicator />
        )}
      </View>

      <View style={styles.dismissWrapper}>
        <AttachmentRemoveControl onPress={onDismissHandler} />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { borderCoreOpacitySubtle } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        dismissWrapper: { position: 'absolute', right: 0, top: 0 },
        image: {
          height: IMAGE_PREVIEW_SIZE,
          width: IMAGE_PREVIEW_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: primitives.radiusLg,
          borderColor: borderCoreOpacitySubtle,
          borderWidth: 1,
          overflow: 'hidden',
        },
        wrapper: {
          padding: primitives.spacingXxs,
        },
      }),
    [borderCoreOpacitySubtle],
  );
};
