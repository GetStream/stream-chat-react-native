import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useMessagePreviewIcon, useMessagePreviewText } from '../../hooks';
import { primitives } from '../../theme';

export type ChannelLastMessagePreviewProps = {
  message: LocalMessage | MessageResponse | DraftMessage;
};

export const ChannelLastMessagePreview = ({ message }: ChannelLastMessagePreviewProps) => {
  const isMessageDeleted = message?.type === 'deleted';
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles({ isMessageDeleted });
  const MessagePreviewIcon = useMessagePreviewIcon({ message });
  const messagePreviewTitle = useMessagePreviewText({ message });

  return (
    <View style={[styles.container]}>
      {MessagePreviewIcon ? (
        <MessagePreviewIcon
          height={16}
          stroke={isMessageDeleted ? semantics.textTertiary : semantics.textSecondary}
          width={16}
        />
      ) : null}
      <Text numberOfLines={1} style={[styles.subtitle]}>
        {messagePreviewTitle}
      </Text>
    </View>
  );
};

const useStyles = ({ isMessageDeleted = false }: { isMessageDeleted?: boolean }) => {
  const {
    theme: {
      channelPreview: { messagePreview },
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
        color: isMessageDeleted ? semantics.textTertiary : semantics.textSecondary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        flexShrink: 1,
        ...messagePreview.subtitle,
      },
    });
  }, [
    isMessageDeleted,
    semantics.textTertiary,
    semantics.textSecondary,
    messagePreview.container,
    messagePreview.subtitle,
  ]);
};
