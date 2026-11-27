import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { components, primitives } from '../../theme';

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
  const isError = type === 'error';
  const Icon = isError ? icons.ExclamationCircleOutline : icons.InfoTooltip;

  return (
    <View
      accessibilityLiveRegion={isError ? 'polite' : undefined}
      accessibilityRole={isError ? 'alert' : undefined}
      style={[
        styles.container,
        {
          backgroundColor: isError
            ? semantics.backgroundUtilityErrorSubtle
            : semantics.accentPrimarySubtle,
        },
        noticeTheme.container,
      ]}
      testID={`schedule-sheet-notice-${type}`}
    >
      <Icon
        height={components.iconSizeMd}
        stroke={isError ? semantics.accentError : semantics.accentPrimary}
        width={components.iconSizeMd}
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: primitives.radiusMd,
    flexDirection: 'row',
    gap: primitives.spacingXs,
    minHeight: 46,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingSm,
  },
  description: {
    fontSize: primitives.typographyFontSizeXs,
    lineHeight: primitives.typographyLineHeightTight,
  },
  texts: {
    flex: 1,
    gap: primitives.spacingXxxs,
  },
  title: {
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightTight,
  },
});
