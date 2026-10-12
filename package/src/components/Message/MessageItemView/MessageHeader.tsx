import React, { useMemo } from 'react';

import { View, ViewStyle } from 'react-native';

import type { Reminder, ReminderState } from 'stream-chat';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useMessageReminder } from '../../../hooks/useMessageReminder';
import { useStateStore } from '../../../hooks/useStateStore';

type MessageHeaderPropsWithContext = Pick<MessageContextValue, 'alignment' | 'message'> & {
  reminder?: Reminder;
  shouldShowPinnedHeader: boolean;
  shouldShowSentToChannelHeader: boolean;
};

// Setting or clearing the time of an existing reminder publishes only on the reminder's own state.
const hasRemindAtSelector = (state: ReminderState) => ({ hasRemindAt: state.remind_at != null });

// Mounted only for a message with a reminder, so other messages never subscribe to one.
const MessageReminderHeaderSwitch = ({ reminder }: { reminder: Reminder }) => {
  const { MessageReminderHeader, MessageSavedForLaterHeader } = useComponentsContext();
  const { hasRemindAt } = useStateStore(reminder.state, hasRemindAtSelector);
  return hasRemindAt ? <MessageReminderHeader /> : <MessageSavedForLaterHeader />;
};

const MessageHeaderWithContext = (props: MessageHeaderPropsWithContext) => {
  const { alignment, message, reminder, shouldShowPinnedHeader, shouldShowSentToChannelHeader } =
    props;
  const { MessagePinnedHeader, SentToChannelHeader } = useComponentsContext();

  const containerStyle: ViewStyle = useMemo(() => {
    return {
      alignItems: alignment === 'left' ? 'flex-start' : 'flex-end',
    };
  }, [alignment]);

  return (
    <View style={containerStyle}>
      {reminder ? <MessageReminderHeaderSwitch reminder={reminder} /> : null}
      {shouldShowPinnedHeader && <MessagePinnedHeader message={message} />}
      {shouldShowSentToChannelHeader && <SentToChannelHeader />}
    </View>
  );
};

const areEqual = (
  prevProps: MessageHeaderPropsWithContext,
  nextProps: MessageHeaderPropsWithContext,
) => {
  const {
    alignment: prevAlignment,
    reminder: prevReminder,
    shouldShowPinnedHeader: prevShouldShowPinnedHeader,
    shouldShowSentToChannelHeader: prevShouldShowSentToChannelHeader,
  } = prevProps;
  const {
    alignment: nextAlignment,
    reminder: nextReminder,
    shouldShowPinnedHeader: nextShouldShowPinnedHeader,
    shouldShowSentToChannelHeader: nextShouldShowSentToChannelHeader,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }

  const reminderEqual = prevReminder === nextReminder;
  if (!reminderEqual) {
    return false;
  }

  const shouldShowPinnedHeaderEqual = prevShouldShowPinnedHeader === nextShouldShowPinnedHeader;
  if (!shouldShowPinnedHeaderEqual) {
    return false;
  }

  const shouldShowSentToChannelHeaderEqual =
    prevShouldShowSentToChannelHeader === nextShouldShowSentToChannelHeader;
  if (!shouldShowSentToChannelHeaderEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageHeader = React.memo(
  MessageHeaderWithContext,
  areEqual,
) as typeof MessageHeaderWithContext;

export type MessageHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessageHeader = (props: MessageHeaderProps) => {
  const { alignment, message } = useMessageContext();
  const reminder = useMessageReminder(message.id);

  const shouldShowPinnedHeader = !!message?.pinned;
  const shouldShowSentToChannelHeader = !!message?.show_in_channel;

  if (!shouldShowPinnedHeader && !reminder && !shouldShowSentToChannelHeader) {
    return null;
  }

  return (
    <MemoizedMessageHeader
      alignment={alignment}
      message={message}
      reminder={reminder}
      shouldShowPinnedHeader={shouldShowPinnedHeader}
      shouldShowSentToChannelHeader={shouldShowSentToChannelHeader}
      {...props}
    />
  );
};
