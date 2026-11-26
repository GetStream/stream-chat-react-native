import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type ScheduleSheetNoticeProps = {
  /** The bold first line. */
  title: string;
  type: 'error' | 'info';
  /** An optional second, regular-weight line. */
  description?: string;
};

/** The error and info boxes of the schedule sheets. */
export const ScheduleSheetNotice = ({ description, title, type }: ScheduleSheetNoticeProps) => {
  const { icons } = useComponentsContext();
  const {
    theme: {
      scheduledMessages: { notice: noticeTheme },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const isError = type === 'error';
  const Icon = isError ? icons.ExclamationCircle : icons.InfoTooltip;

  return (
    <View
      accessibilityLiveRegion={isError ? 'polite' : undefined}
      accessibilityRole={isError ? 'alert' : undefined}
      style={[
        styles.container,
        {
          backgroundColor: isError
            ? semantics.backgroundUtilityErrorSubtle
            : semantics.backgroundUtilityInfoSubtle,
        },
        noticeTheme.container,
      ]}
      testID={`schedule-sheet-notice-${type}`}
    >
      <Icon
        height={20}
        stroke={isError ? semantics.accentError : semantics.accentPrimary}
        width={20}
      />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: semantics.textPrimary }, noticeTheme.title]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              styles.description,
              { color: semantics.textSecondary },
              noticeTheme.description,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          borderRadius: primitives.radiusLg,
          flexDirection: 'row',
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingSm,
        },
        description: {
          fontSize: primitives.typographyFontSizeXs,
          lineHeight: primitives.typographyLineHeightTight,
        },
        texts: {
          flex: 1,
        },
        title: {
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightTight,
        },
      }),
    [],
  );
