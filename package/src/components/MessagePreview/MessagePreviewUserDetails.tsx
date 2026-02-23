import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';

import { Channel, LocalMessage, MessageResponse } from 'stream-chat';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { ChannelListMessageDeliveryStatus } from '../ChannelPreview/ChannelListMessageDeliveryStatus';

export type MessagePreviewUserDetailsProps = {
  message: LocalMessage | MessageResponse;
  channel: Channel;
};

export const MessagePreviewUserDetails = ({ channel, message }: MessagePreviewUserDetailsProps) => {
  const styles = useStyles();
  const { client } = useChatContext();

  return message?.user?.id === client.user?.id ? (
    <ChannelListMessageDeliveryStatus channel={channel} lastMessage={message} />
  ) : (
    <Text style={styles.username}>{message?.user?.name || message?.user?.id}:</Text>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      username: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
    });
  }, [semantics]);
};
