import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChannelPreviewProps } from './ChannelPreview';
import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';
import { MessageReadStatus } from './hooks/useLatestMessagePreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Check, CheckAll } from '../../icons';

import { getDateString } from '../../utils/i18n/getDateString';

const styles = StyleSheet.create({
  date: {
    fontSize: 12,
    marginLeft: 2,
    textAlign: 'right',
  },
  flexRow: {
    flexDirection: 'row',
  },
});

export type ChannelPreviewStatusProps = Pick<
  ChannelPreviewMessengerPropsWithContext,
  'latestMessagePreview' | 'formatLatestMessageDate'
> &
  Pick<ChannelPreviewProps, 'channel'>;

export const ChannelPreviewStatus = (props: ChannelPreviewStatusProps) => {
  const { formatLatestMessageDate, latestMessagePreview } = props;
  const { t, tDateTimeParser } = useTranslationContext();
  const {
    theme: {
      channelPreview: { checkAllIcon, checkIcon, date },
      colors: { accent_blue, grey },
    },
  } = useTheme();

  const created_at = latestMessagePreview.messageObject?.created_at;
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
  const status = latestMessagePreview.status;

  return (
    <View style={styles.flexRow}>
      {status === MessageReadStatus.READ ? (
        <CheckAll pathFill={accent_blue} {...checkAllIcon} />
      ) : status === MessageReadStatus.UNREAD ? (
        <Check pathFill={grey} {...checkIcon} />
      ) : null}
      <Text style={[styles.date, { color: grey }, date]}>
        {formatLatestMessageDate && latestMessageDate
          ? formatLatestMessageDate(latestMessageDate).toString()
          : formattedDate}
      </Text>
    </View>
  );
};
