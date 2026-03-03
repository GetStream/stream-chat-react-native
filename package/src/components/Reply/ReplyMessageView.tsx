import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { LocalMessage, MessageResponse } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useMessagePreviewIcon, useMessagePreviewText } from '../../hooks';
import { primitives } from '../../theme';

export type ReplyMessageViewProps = {
  message: LocalMessage | MessageResponse;
  isMyMessage: boolean;
};

export const ReplyMessageView = ({ message, isMyMessage }: ReplyMessageViewProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles({ isMyMessage });
  const MessagePreviewIcon = useMessagePreviewIcon({ message });
  const messagePreviewTitle = useMessagePreviewText({ message });

  return (
    <View style={[styles.container]}>
      {MessagePreviewIcon ? (
        <MessagePreviewIcon
          height={12}
          stroke={isMyMessage ? semantics.chatTextOutgoing : semantics.chatTextIncoming}
          width={12}
        />
      ) : null}
      <Text numberOfLines={1} style={[styles.subtitle]}>
        {messagePreviewTitle}
      </Text>
    </View>
  );
};

const useStyles = ({ isMyMessage = false }: { isMyMessage?: boolean }) => {
  const {
    theme: {
      reply: { messagePreview },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
        flexShrink: 1,
        ...messagePreview.container,
      },
      subtitle: {
        color: isMyMessage ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightTight,
        flexShrink: 1,
        ...messagePreview.subtitle,
      },
    });
  }, [
    isMyMessage,
    semantics.chatTextOutgoing,
    semantics.chatTextIncoming,
    messagePreview.container,
    messagePreview.subtitle,
  ]);
};
