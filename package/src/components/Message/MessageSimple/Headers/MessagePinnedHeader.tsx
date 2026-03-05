import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Pin } from '../../../../icons/Pin';
import { primitives } from '../../../../theme';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

export type MessagePinnedHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessagePinnedHeader = (props: MessagePinnedHeaderProps) => {
  const { message: propMessage } = props;
  const { message: contextMessage } = useMessageContext();
  const message = propMessage || contextMessage;
  const styles = useStyles();
  const { t } = useTranslationContext();
  const { client } = useChatContext();

  if (!message?.pinned) {
    return null;
  }

  return (
    <View accessibilityLabel='Message Pinned Header' style={styles.container}>
      <Pin height={16} width={16} stroke={styles.label.color} />
      <Text style={styles.label}>
        {t('Pinned by')}{' '}
        {message?.pinned_by?.id === client?.user?.id ? t('You') : message?.pinned_by?.name}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        pinnedHeader: { container, label },
      },
    },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
        paddingVertical: primitives.spacingXxs,
        ...container,
      },
      label: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
    });
  }, [shouldUseOverlayStyles, semantics, container, label]);
};
