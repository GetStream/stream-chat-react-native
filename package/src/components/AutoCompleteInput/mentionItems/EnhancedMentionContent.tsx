import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type EnhancedMentionContentProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  testID?: string;
};

/**
 * Title + optional subtitle pair used by every non-user mention row
 * (channel / here / role / user_group). Override styling via
 * `theme.messageComposer.suggestions.mention.enhancedMention{Container,Title,Subtitle}`.
 */
export const EnhancedMentionContent = ({
  subtitle,
  testID,
  title,
}: EnhancedMentionContentProps) => {
  const {
    theme: {
      semantics,
      messageComposer: {
        suggestions: {
          mention: { enhancedMentionContainer, enhancedMentionSubtitle, enhancedMentionTitle },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, enhancedMentionContainer]}>
      <Text
        style={[styles.title, { color: semantics.textPrimary }, enhancedMentionTitle]}
        testID={testID}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: semantics.textSecondary }, enhancedMentionSubtitle]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: primitives.spacingXxxs,
        },
        subtitle: {
          fontSize: primitives.typographyFontSizeXs,
          lineHeight: primitives.typographyLineHeightTight,
        },
        title: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [],
  );
