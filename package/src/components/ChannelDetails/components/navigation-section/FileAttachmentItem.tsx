import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  type Attachment,
  type Channel,
  isAudioAttachment,
  isFileAttachment,
  type MessageResponse,
} from 'stream-chat';

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
  /** The channel the file attachment belongs to. */
  channel: Channel;
  /** The message whose file attachments are rendered. */
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
  const { message, onPress } = props;
  const {
    theme: {
      channelDetails: { fileAttachmentItem },
    },
  } = useTheme();
  const styles = useStyles();

  const fileAttachments = useMemo(
    () =>
      (message.attachments ?? []).filter(
        (attachment) => isFileAttachment(attachment) || isAudioAttachment(attachment),
      ),
    [message.attachments],
  );

  if (fileAttachments.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.container, fileAttachmentItem.container]}
      testID={`file-attachment-item-${message.id}`}
    >
      {fileAttachments.map((attachment, index) => (
        <Pressable
          accessibilityRole='button'
          key={`${message.id}-${index}`}
          onPress={() =>
            onPress ? onPress({ attachment, message }) : openUrlSafely(attachment.asset_url)
          }
          testID={`file-attachment-row-${message.id}-${index}`}
        >
          <FilePreview attachment={attachment} styles={styles.filePreview} />
        </Pressable>
      ))}
    </View>
  );
};

FileAttachmentItem.displayName = 'FileAttachmentItem{fileAttachmentItem}';

const useStyles = () => {
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
      filePreview: StyleSheet.create({ container: { width: '100%' } }),
    }),
    [],
  );
};
