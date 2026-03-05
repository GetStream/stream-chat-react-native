import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Check } from '../../../icons/Check';
import { CheckAll } from '../../../icons/CheckAll';
import { Time } from '../../../icons/Time';
import { primitives } from '../../../theme';
import { MessageStatusTypes } from '../../../utils/utils';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

export type MessageStatusPropsWithContext = Pick<
  MessageContextValue,
  'deliveredToCount' | 'message' | 'readBy'
> &
  Pick<MessagesContextValue, 'MessageTimestamp'> & {
    formattedDate?: string | Date;
    timestamp?: string | Date;
  };

const MessageStatusWithContext = (props: MessageStatusPropsWithContext) => {
  const { deliveredToCount, formattedDate, message, readBy, timestamp, MessageTimestamp } = props;

  const styles = useStyles();

  const {
    theme: {
      messageSimple: {
        status: { checkAllIcon, checkIcon, container, timeIcon },
      },
      semantics,
    },
  } = useTheme();

  if (message.status === MessageStatusTypes.FAILED || message.type === 'error') {
    return null;
  }

  const hasReadByGreaterThanOne = typeof readBy === 'number' && readBy > 1;

  // Variables to determine the status of the message
  const read = hasReadByGreaterThanOne || readBy === true;
  const delivered = deliveredToCount > 1;
  const sending = message.status === MessageStatusTypes.SENDING;
  const sent =
    message.status === MessageStatusTypes.RECEIVED &&
    !delivered &&
    !read &&
    message.type !== 'ephemeral';

  return (
    <View style={[styles.container, container]}>
      {read ? (
        <CheckAll
          height={16}
          stroke={semantics.accentPrimary}
          width={16}
          accessibilityLabel='Read'
          {...checkAllIcon}
        />
      ) : delivered ? (
        <CheckAll
          stroke={semantics.chatTextTimestamp}
          height={16}
          width={16}
          accessibilityLabel='Delivered'
          {...checkAllIcon}
        />
      ) : sending ? (
        <Time
          stroke={semantics.chatTextTimestamp}
          height={16}
          width={16}
          accessibilityLabel='Sending'
          {...timeIcon}
        />
      ) : sent ? (
        <Check
          stroke={semantics.chatTextTimestamp}
          height={16}
          width={16}
          accessibilityLabel='Sent'
          {...checkIcon}
        />
      ) : null}
      <MessageTimestamp formattedDate={formattedDate} timestamp={timestamp} />
    </View>
  );
};

const areEqual = (
  prevProps: MessageStatusPropsWithContext,
  nextProps: MessageStatusPropsWithContext,
) => {
  const {
    deliveredToCount: prevDeliveredBy,
    message: prevMessage,
    readBy: prevReadBy,
    formattedDate: prevFormattedDate,
    timestamp: prevTimestamp,
  } = prevProps;
  const {
    deliveredToCount: nextDeliveredBy,
    message: nextMessage,
    readBy: nextReadBy,
    formattedDate: nextFormattedDate,
    timestamp: nextTimestamp,
  } = nextProps;

  const deliveredByEqual = prevDeliveredBy === nextDeliveredBy;
  if (!deliveredByEqual) {
    return false;
  }

  const readByEqual = prevReadBy === nextReadBy;
  if (!readByEqual) {
    return false;
  }

  const messageEqual =
    prevMessage.status === nextMessage.status && prevMessage.type === nextMessage.type;
  if (!messageEqual) {
    return false;
  }

  const timestampEqual = prevTimestamp === nextTimestamp;
  if (!timestampEqual) {
    return false;
  }

  const formattedDateEqual = prevFormattedDate === nextFormattedDate;
  if (!formattedDateEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageStatus = React.memo(
  MessageStatusWithContext,
  areEqual,
) as typeof MessageStatusWithContext;

export type MessageStatusProps = Partial<MessageStatusPropsWithContext>;

export const MessageStatus = (props: MessageStatusProps) => {
  const { channel } = useChannelContext();
  const { deliveredToCount, message, readBy } = useMessageContext();
  const { MessageTimestamp } = useMessagesContext();

  const channelMembersCount = Object.keys(channel?.state.members).length;

  return (
    <MemoizedMessageStatus
      {...{
        channel,
        channelMembersCount,
        deliveredToCount,
        message,
        readBy,
        MessageTimestamp,
      }}
      {...props}
    />
  );
};

MessageStatus.displayName = 'MessageStatus{messageSimple{status}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      readByCount: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
    });
  }, [shouldUseOverlayStyles, semantics]);
};
