import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Check, CheckAll } from '../../icons';

import type { DefaultStreamChatGenerics } from '../../types/types';

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

export type ChannelPreviewStatusProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ChannelPreviewMessengerPropsWithContext<StreamChatGenerics>,
  'latestMessagePreview' | 'formatLatestMessageDate'
> &
  Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'>;

export const ChannelPreviewStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewStatusProps<StreamChatGenerics>,
) => {
  const { formatLatestMessageDate, latestMessagePreview } = props;
  const {
    theme: {
      channelPreview: { checkAllIcon, checkIcon, date },
      colors: { accent_blue, grey },
    },
  } = useTheme('ChannelPreviewStatus');

  const created_at = latestMessagePreview.messageObject?.created_at;
  const latestMessageDate = created_at ? new Date(created_at) : new Date();
  const status = latestMessagePreview.status;

  return (
    <View style={styles.flexRow}>
      {status === 2 ? (
        <CheckAll pathFill={accent_blue} {...checkAllIcon} />
      ) : status === 1 ? (
        <Check pathFill={grey} {...checkIcon} />
      ) : null}
      <Text style={[styles.date, { color: grey }, date]}>
        {formatLatestMessageDate && latestMessageDate
          ? formatLatestMessageDate(latestMessageDate)
          : latestMessagePreview.created_at}
      </Text>
    </View>
  );
};
