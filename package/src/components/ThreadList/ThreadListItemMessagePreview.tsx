import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadListItemContext } from '../../contexts/threadsContext/ThreadListItemContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useMessagePreviewIcon, useMessagePreviewText } from '../../hooks';
import { primitives } from '../../theme';

export type ThreadListItemMessagePreviewProps = {
  message: LocalMessage | MessageResponse | DraftMessage;
};

export const ThreadListItemMessagePreview = ({ message }: ThreadListItemMessagePreviewProps) => {
  const { draftMessage } = useThreadListItemContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { t } = useTranslationContext();
  const previewMessage = draftMessage ?? message;
  const MessagePreviewIcon = useMessagePreviewIcon({ message: previewMessage });
  const messagePreviewTitle = useMessagePreviewText({ message: previewMessage });
  const isDraft = !!draftMessage;

  return (
    <View style={[styles.container]}>
      {isDraft ? <Text style={styles.draftText}>{t('Draft')}:</Text> : null}
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
      draftText: {
        color: semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        ...messagePreview.draftText,
      },
    });
  }, [messagePreview.container, messagePreview.draftText, messagePreview.subtitle, semantics]);
};
