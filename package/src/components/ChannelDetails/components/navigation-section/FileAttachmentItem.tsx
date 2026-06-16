import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type Attachment, type MessageResponse } from 'stream-chat';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { FilePreview } from '../../../Attachment/FilePreview';
import { openUrlSafely } from '../../../Attachment/utils/openUrlSafely';

/**
 * The shape passed to `FileAttachmentItem`'s `onPress` callback, identifying the rendered
 * attachment and the message it belongs to.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type FileAttachmentItemPressParams = {
  attachment: Attachment;
  message: MessageResponse;
};

export type FileAttachmentItemProps = {
  /** The file/audio attachment to render. */
  attachment: Attachment;
  /** The message the attachment belongs to. */
  message: MessageResponse;
  /**
   * Fired with the pressed attachment and its message. When provided, this overrides the default
   * behavior of opening the attachment's `asset_url`.
   */
  onPress?: (params: FileAttachmentItemPressParams) => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const FileAttachmentItem = (props: FileAttachmentItemProps) => {
  const { attachment, message, onPress } = props;
  const {
    theme: {
      channelDetails: { fileAttachmentItem },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[styles.container, fileAttachmentItem.container]}
      testID={`file-attachment-item-${message.id}`}
    >
      <Pressable
        accessibilityRole='button'
        onPress={() =>
          onPress ? onPress({ attachment, message }) : openUrlSafely(attachment.asset_url)
        }
        testID={`file-attachment-row-${message.id}`}
      >
        <FilePreview attachment={attachment} styles={styles.filePreview} />
      </Pressable>
    </View>
  );
};

FileAttachmentItem.displayName = 'FileAttachmentItem{fileAttachmentItem}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () => ({
      ...StyleSheet.create({
        container: {
          gap: primitives.spacingXxs,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
      }),
      // FilePreview's default container has a hardcoded width; stretch it to the row width.
      filePreview: StyleSheet.create({
        container: { width: '100%' },
        title: {
          fontWeight: primitives.typographyFontWeightRegular,
          fontSize: primitives.typographyFontSizeMd,
        },
        size: { color: semantics.textTertiary },
      }),
    }),
    [semantics],
  );
};
