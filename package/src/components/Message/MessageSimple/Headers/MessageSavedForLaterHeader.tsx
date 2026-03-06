import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Bookmark } from '../../../../icons/Bookmark';
import { primitives } from '../../../../theme';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

export type MessageSavedForLaterHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessageSavedForLaterHeader = () => {
  const styles = useStyles();
  const { t } = useTranslationContext();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <Bookmark height={16} width={16} stroke={styles.label.color} />
      <Text style={styles.label}>{t('Saved For Later')}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        savedForLaterHeader: { container, label },
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
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
    });
  }, [shouldUseOverlayStyles, semantics, container, label]);
};
