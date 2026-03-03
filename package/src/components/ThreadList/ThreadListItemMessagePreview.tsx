import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useMessagePreviewIcon, useMessagePreviewText } from '../../hooks';
import { primitives } from '../../theme';

export type ThreadListItemMessagePreviewProps = {
  message: LocalMessage | MessageResponse | DraftMessage;
};

export const ThreadListItemMessagePreview = ({ message }: ThreadListItemMessagePreviewProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const MessagePreviewIcon = useMessagePreviewIcon({ message });
  const messagePreviewTitle = useMessagePreviewText({ message });

  return (
    <View style={[styles.container]}>
      {MessagePreviewIcon ? (
        <MessagePreviewIcon height={20} stroke={semantics.textPrimary} width={20} />
      ) : null}
      <Text numberOfLines={1} style={[styles.subtitle]}>
        {messagePreviewTitle}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      threadListItem: { messagePreview },
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
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        flexShrink: 1,
        ...messagePreview.subtitle,
      },
    });
  }, [messagePreview.container, messagePreview.subtitle, semantics.textPrimary]);
};
