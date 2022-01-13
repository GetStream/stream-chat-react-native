import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Check, CheckAll } from '../../icons';

import type { StreamChatGenerics } from '../../types/types';

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

export type ChannelPreviewStatusProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<
  ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  'latestMessagePreview' | 'formatLatestMessageDate'
> &
  Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>;

export const ChannelPreviewStatus = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelPreviewStatusProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { formatLatestMessageDate, latestMessagePreview } = props;
  const {
    theme: {
      channelPreview: { checkAllIcon, checkIcon, date },
      colors: { accent_blue, grey },
    },
  } = useTheme();

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
