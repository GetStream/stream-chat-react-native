import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type Attachment, type MessageResponse } from 'stream-chat';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { FilePreview } from '../../../Attachment/FilePreview';
import { openUrlSafely } from '../../../Attachment/utils/openUrlSafely';

/**
 * Passed to the `onPress` callback of `FileAttachmentItem`: the attachment and its message.
 */
export type FileAttachmentItemPressParams = {
  attachment: Attachment;
  message: MessageResponse;
};

export type FileAttachmentItemProps = {
  /** The file or audio attachment to render. */
  attachment: Attachment;
  /** The message the attachment belongs to. */
  message: MessageResponse;
  /** Overrides the default behavior of opening the attachment's `asset_url`. */
  onPress?: (params: FileAttachmentItemPressParams) => void;
};

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
      // The default `FilePreview` container has a fixed width, so stretch it to the row.
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
