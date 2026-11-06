import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ChannelConfig } from 'stream-chat';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { primitives } from '../../../theme';
import { MessageStatusTypes } from '../../../utils/utils';
import { HiddenA11yText } from '../../Accessibility/HiddenA11yText';
import { useIsMessageDeliveredToOthers } from '../hooks/useIsMessageDeliveredToOthers';
import { useIsMessageReadByOthers } from '../hooks/useIsMessageReadByOthers';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

const readEventsSelector = ({ readEvents }: ChannelConfig) => ({
  readEventsEnabled: readEvents.enabled,
});

export type MessageStatusPropsWithContext = Pick<MessageContextValue, 'message'> & {
  /** Whether the message reached at least one other member. */
  delivered: boolean;
  /** Whether at least one other member read the message. */
  read: boolean;
  /**
   * Whether the channel has read events. Without them only the sending status shows, as in the
   * channel preview.
   * @default true
   */
  readEventsEnabled?: boolean;
};

const MessageStatusWithContext = (props: MessageStatusPropsWithContext) => {
  const { message, readEventsEnabled = true } = props;
  const delivered = readEventsEnabled && props.delivered;
  const read = readEventsEnabled && props.read;

  const styles = useStyles();
  const { icons } = useComponentsContext();

  const {
    theme: {
      messageItemView: {
        status: { checkAllIcon, checkIcon, container, timeIcon },
      },
    },
  } = useTheme();

  const sending = message.status === MessageStatusTypes.SENDING;
  const sent =
    readEventsEnabled &&
    message.status === MessageStatusTypes.RECEIVED &&
    !delivered &&
    !read &&
    message.type !== 'ephemeral';

  const accessibilityLabel = useA11yLabel(
    read
      ? 'message.status.read.accessibilityLabel'
      : delivered
        ? 'message.status.delivered.accessibilityLabel'
        : sending
          ? 'message.status.sending.accessibilityLabel'
          : sent
            ? 'message.status.sent.accessibilityLabel'
            : '',
  );

  if (
    message.status === MessageStatusTypes.FAILED ||
    message.type === 'error' ||
    message.type === 'deleted'
  ) {
    return null;
  }

  return (
    <>
      <HiddenA11yText label={accessibilityLabel} />
      <View
        accessibilityElementsHidden={!!accessibilityLabel}
        importantForAccessibility={accessibilityLabel ? 'no-hide-descendants' : undefined}
        style={[styles.container, container]}
      >
        {read ? (
          <icons.CheckAll
            height={16}
            stroke={styles.readCheck.color}
            testID='message-status-read'
            width={16}
            {...checkAllIcon}
          />
        ) : delivered ? (
          <icons.CheckAll
            stroke={styles.deliveredCheck.color}
            height={16}
            testID='message-status-delivered'
            width={16}
            {...checkAllIcon}
          />
        ) : sending ? (
          <icons.Time
            stroke={styles.sendingCheck.color}
            height={16}
            testID='message-status-sending'
            width={16}
            {...timeIcon}
          />
        ) : sent ? (
          <icons.Check
            stroke={styles.sentCheck.color}
            height={16}
            testID='message-status-sent'
            width={16}
            {...checkIcon}
          />
        ) : null}
      </View>
    </>
  );
};

const areEqual = (
  prevProps: MessageStatusPropsWithContext,
  nextProps: MessageStatusPropsWithContext,
) => {
  const {
    delivered: prevDelivered,
    message: prevMessage,
    read: prevRead,
    readEventsEnabled: prevReadEventsEnabled,
  } = prevProps;
  const {
    delivered: nextDelivered,
    message: nextMessage,
    read: nextRead,
    readEventsEnabled: nextReadEventsEnabled,
  } = nextProps;

  const readEventsEnabledEqual = prevReadEventsEnabled === nextReadEventsEnabled;
  if (!readEventsEnabledEqual) {
    return false;
  }

  const deliveredEqual = prevDelivered === nextDelivered;
  if (!deliveredEqual) {
    return false;
  }

  const readEqual = prevRead === nextRead;
  if (!readEqual) {
    return false;
  }

  const messageEqual =
    prevMessage.status === nextMessage.status && prevMessage.type === nextMessage.type;
  if (!messageEqual) {
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
  const { message: contextMessage } = useMessageContext();
  const message = props.message ?? contextMessage;
  const { channel } = useChannelContext();
  const readByOthers = useIsMessageReadByOthers({ message });
  const deliveredToOthers = useIsMessageDeliveredToOthers({ message });
  const { readEventsEnabled } = useStateStore(channel?.configState, readEventsSelector) ?? {};

  return (
    <MemoizedMessageStatus
      delivered={props.delivered ?? deliveredToOthers}
      message={message}
      read={props.read ?? readByOthers}
      readEventsEnabled={props.readEventsEnabled ?? readEventsEnabled}
    />
  );
};

MessageStatus.displayName = 'MessageStatus{messageItemView{status}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      readCheck: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.accentPrimary,
      },
      deliveredCheck: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
      },
      sendingCheck: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
      },
      sentCheck: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
      },
    });
  }, [shouldUseOverlayStyles, semantics]);
};
