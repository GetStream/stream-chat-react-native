import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';
import type { ChannelPreviewViewPropsWithContext } from './ChannelPreviewView';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { primitives } from '../../theme';
import { getDateString, getDateStringForA11y } from '../../utils/i18n/getDateString';

export type ChannelPreviewStatusProps = Pick<
  ChannelPreviewViewPropsWithContext,
  'formatLatestMessageDate' | 'lastMessage'
> &
  Pick<ChannelPreviewProps, 'channel'>;

export const ChannelPreviewStatus = (props: ChannelPreviewStatusProps) => {
  const { formatLatestMessageDate, lastMessage } = props;
  const { t, tDateTimeParser, userLanguage } = useTranslationContext();
  const styles = useStyles();

  const created_at = lastMessage?.created_at;
  const latestMessageDate = created_at ? new Date(created_at) : new Date();

  const formattedDate = useMemo(
    () =>
      getDateString({
        date: created_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ChannelPreviewStatus',
      }),
    [created_at, t, tDateTimeParser],
  );

  const a11yDate = useMemo(
    () =>
      getDateStringForA11y({
        calendarFormatOverrides: { sameDay: 'LT' },
        date: created_at,
        tDateTimeParser,
        userLanguage,
      }),
    [created_at, tDateTimeParser, userLanguage],
  );

  const visibleDate =
    formatLatestMessageDate && latestMessageDate
      ? formatLatestMessageDate(latestMessageDate).toString()
      : formattedDate;
  const labelParams = useMemo(
    () => ({ date: a11yDate ?? visibleDate ?? '' }),
    [a11yDate, visibleDate],
  );
  const accessibilityLabel = useA11yLabel('a11y/Last message {{date}}', labelParams);

  return (
    <Text accessibilityLabel={accessibilityLabel} style={styles.date}>
      {visibleDate}
    </Text>
  );
};

const useStyles = () => {
  const {
    theme: {
      channelPreview: { date },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      date: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        ...date,
      },
    });
  }, [semantics, date]);
};
