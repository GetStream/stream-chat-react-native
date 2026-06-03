import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

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
    <>
      <Text style={[styles.title, { color: semantics.textPrimary }, nameStyle]} testID={testID}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: semantics.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        subtitle: {
          fontSize: primitives.typographyFontSizeSm,
          lineHeight: primitives.typographyLineHeightTight,
          marginTop: 2,
        },
        title: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [],
  );
