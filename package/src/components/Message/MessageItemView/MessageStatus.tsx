import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { MessageStatusTypes } from '../../../utils/utils';
import { HiddenA11yText } from '../../Accessibility/HiddenA11yText';
import { useIsMessageDeliveredToOthers } from '../hooks/useIsMessageDeliveredToOthers';
import { useIsMessageReadByOthers } from '../hooks/useIsMessageReadByOthers';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

export type MessageStatusPropsWithContext = Pick<MessageContextValue, 'message'> & {
  /** Whether the message reached at least one other member. */
  delivered: boolean;
  /** Whether at least one other member read the message. */
  read: boolean;
};

const MessageStatusWithContext = (props: MessageStatusPropsWithContext) => {
  const { delivered, message, read } = props;

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

  if (message.status === MessageStatusTypes.FAILED || message.type === 'error') {
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
            width={16}
            {...checkAllIcon}
          />
        ) : delivered ? (
          <icons.CheckAll
            stroke={styles.deliveredCheck.color}
            height={16}
            width={16}
            {...checkAllIcon}
          />
        ) : sending ? (
          <icons.Time stroke={styles.sendingCheck.color} height={16} width={16} {...timeIcon} />
        ) : sent ? (
          <icons.Check stroke={styles.sentCheck.color} height={16} width={16} {...checkIcon} />
        ) : null}
      </View>
    </>
  );
};

const areEqual = (
  prevProps: MessageStatusPropsWithContext,
  nextProps: MessageStatusPropsWithContext,
) => {
  const { delivered: prevDelivered, message: prevMessage, read: prevRead } = prevProps;
  const { delivered: nextDelivered, message: nextMessage, read: nextRead } = nextProps;

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
  const readByOthers = useIsMessageReadByOthers({ message });
  const deliveredToOthers = useIsMessageDeliveredToOthers({ message });

  return (
    <MemoizedMessageStatus
      delivered={props.delivered ?? deliveredToOthers}
      message={message}
      read={props.read ?? readByOthers}
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
