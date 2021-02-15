import React from 'react';
import { useTheme } from '../../contexts';
import { StyleSheet, Text } from 'react-native';
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
import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';

const styles = StyleSheet.create({
  bold: { fontWeight: 'bold' },
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
  Us extends UnknownType = DefaultUserType
> = {
  latestMessagePreview: Pick<
    ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'latestMessagePreview'
  >;
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
            style={[{ color: grey }, preview.bold ? styles.bold : {}]}
          >
            {preview.text}
          </Text>
        ) : null,
      )}
    </Text>
  );
};
