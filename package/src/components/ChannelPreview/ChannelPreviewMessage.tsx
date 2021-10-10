import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  message: {
    flexShrink: 1,
    fontSize: 12,
  },
});

export type ChannelPreviewMessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  latestMessagePreview: LatestMessagePreview<At, Ch, Co, Ev, Me, Re, Us>;
};
export const ChannelPreviewMessage: React.FC<ChannelPreviewMessageProps> = ({
  latestMessagePreview,
}) => {
  const {
    theme: {
      channelPreview: { message },
      colors: { grey },
    },
  } = useTheme();

  return (
    <Text numberOfLines={1} style={[styles.message, { color: grey }, message]}>
      {latestMessagePreview.previews.map((preview, index) =>
        preview.text ? (
          <Text
            key={`${preview.text}_${index}`}
            style={[{ color: grey }, preview.bold ? styles.bold : {}, message]}
          >
            {preview.text}
          </Text>
        ) : null,
      )}
    </Text>
  );
};
