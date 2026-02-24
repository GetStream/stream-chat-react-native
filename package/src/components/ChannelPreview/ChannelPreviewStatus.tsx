import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ChannelPreviewProps } from './ChannelPreview';
import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { primitives } from '../../theme';
import { getDateString } from '../../utils/i18n/getDateString';

export type ChannelPreviewStatusProps = Pick<
  ChannelPreviewMessengerPropsWithContext,
  'formatLatestMessageDate' | 'lastMessage'
> &
  Pick<ChannelPreviewProps, 'channel'>;

export const ChannelPreviewStatus = (props: ChannelPreviewStatusProps) => {
  const { formatLatestMessageDate, lastMessage } = props;
  const { t, tDateTimeParser } = useTranslationContext();
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

  return (
    <Text style={styles.date}>
      {formatLatestMessageDate && latestMessageDate
        ? formatLatestMessageDate(latestMessageDate).toString()
        : formattedDate}
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
