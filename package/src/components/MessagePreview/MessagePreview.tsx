import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts';

export type MessagePreviewSkeletonProps = {
  /**
   * Whether the message text should be bold.
   */
  bold: boolean;
  /**
   * The text of the message preview.
   */
  text: string;
  /**
   * Whether the message is a draft.
   */
  draft?: boolean;
};

export type MessagePreviewProps = {
  previews: MessagePreviewSkeletonProps[];
};

export const MessagePreview = ({ previews }: MessagePreviewProps) => {
  const {
    theme: {
      messagePreview: { message },
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return (
    <View style={styles.container}>
      {previews?.map((preview, index) =>
        preview.text ? (
          <Text
            key={`${preview.text}_${index}`}
            numberOfLines={1}
            style={[
              styles.message,
              {
                color: preview?.draft ? accent_blue : grey,
              },
              preview.bold ? styles.bold : {},
              message,
            ]}
          >
            {preview.text}
          </Text>
        ) : null,
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bold: { fontWeight: '500' },
  container: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  message: {
    flexShrink: 1,
    marginRight: 2,
  },
});
