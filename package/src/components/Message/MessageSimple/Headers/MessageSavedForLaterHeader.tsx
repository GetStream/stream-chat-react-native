import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Bookmark } from '../../../../icons/Bookmark';
import { primitives } from '../../../../theme';

export type MessageSavedForLaterHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessageSavedForLaterHeader = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { t } = useTranslationContext();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <Bookmark height={16} width={16} stroke={semantics.accentPrimary} />
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
        color: semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
    });
  }, [semantics, container, label]);
};
