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
 * (channel / here / role / user_group). Typography and color come from the
 * SDK semantic theme — customize via `theme.messageComposer.suggestions.mention.name`
 * rather than per-instance style props.
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
          mention: { name: nameStyle },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: semantics.textPrimary }, nameStyle]} testID={testID}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: semantics.textSecondary }]}>{subtitle}</Text>
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
