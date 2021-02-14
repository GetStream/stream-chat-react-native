import React from 'react';
import { useTheme } from '../../contexts';
import { StyleSheet, Text, View } from 'react-native';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';
import { Check, CheckAll } from '../..//icons';
import type { ChannelPreviewMessengerPropsWithContext } from './ChannelPreviewMessenger';

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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  'latestMessagePreview' | 'formatLatestMessageDate'
>;
export const ChannelPreviewStatus: React.FC<ChannelPreviewStatusProps> = ({
  formatLatestMessageDate,
  latestMessagePreview,
}) => {
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
