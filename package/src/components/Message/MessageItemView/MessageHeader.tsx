import React, { useMemo } from 'react';

import { View, ViewStyle } from 'react-native';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useMessageReminder } from '../../../hooks/useMessageReminder';

type MessageHeaderPropsWithContext = Pick<MessageContextValue, 'alignment' | 'message'> & {
  shouldShowSavedForLaterHeader?: boolean;
  shouldShowPinnedHeader: boolean;
  shouldShowReminderHeader: boolean;
  shouldShowSentToChannelHeader: boolean;
};

const MessageHeaderWithContext = (props: MessageHeaderPropsWithContext) => {
  const {
    alignment,
    message,
    shouldShowSavedForLaterHeader,
    shouldShowPinnedHeader,
    shouldShowReminderHeader,
    shouldShowSentToChannelHeader,
  } = props;
  const {
    MessagePinnedHeader,
    MessageReminderHeader,
    MessageSavedForLaterHeader,
    SentToChannelHeader,
  } = useComponentsContext();

  const containerStyle: ViewStyle = useMemo(() => {
    return {
      alignItems: alignment === 'left' ? 'flex-start' : 'flex-end',
    };
  }, [alignment]);

  return (
    <View style={containerStyle}>
      {shouldShowReminderHeader && <MessageReminderHeader />}
      {shouldShowSavedForLaterHeader && <MessageSavedForLaterHeader />}
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
    shouldShowSavedForLaterHeader: prevShouldShowSavedForLaterHeader,
    shouldShowPinnedHeader: prevShouldShowPinnedHeader,
    shouldShowReminderHeader: prevShouldShowReminderHeader,
    shouldShowSentToChannelHeader: prevShouldShowSentToChannelHeader,
  } = prevProps;
  const {
    alignment: nextAlignment,
    shouldShowSavedForLaterHeader: nextShouldShowSavedForLaterHeader,
    shouldShowPinnedHeader: nextShouldShowPinnedHeader,
    shouldShowReminderHeader: nextShouldShowReminderHeader,
    shouldShowSentToChannelHeader: nextShouldShowSentToChannelHeader,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }

  const shouldShowSavedForLaterHeaderEqual =
    prevShouldShowSavedForLaterHeader === nextShouldShowSavedForLaterHeader;
  if (!shouldShowSavedForLaterHeaderEqual) {
    return false;
  }

  const shouldShowPinnedHeaderEqual = prevShouldShowPinnedHeader === nextShouldShowPinnedHeader;
  if (!shouldShowPinnedHeaderEqual) {
    return false;
  }

  const shouldShowReminderHeaderEqual =
    prevShouldShowReminderHeader === nextShouldShowReminderHeader;
  if (!shouldShowReminderHeaderEqual) {
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

  const shouldShowSavedForLaterHeader = reminder && !reminder.remindAt;
  const shouldShowReminderHeader = reminder && reminder.remindAt;
  const shouldShowPinnedHeader = !!message?.pinned;
  const shouldShowSentToChannelHeader = !!message?.show_in_channel;

  if (
    !shouldShowPinnedHeader &&
    !shouldShowSavedForLaterHeader &&
    !shouldShowReminderHeader &&
    !shouldShowSentToChannelHeader
  ) {
    return null;
  }

  return (
    <MemoizedMessageHeader
      alignment={alignment}
      message={message}
      shouldShowSavedForLaterHeader={shouldShowSavedForLaterHeader}
      shouldShowPinnedHeader={shouldShowPinnedHeader}
      shouldShowReminderHeader={!!shouldShowReminderHeader}
      shouldShowSentToChannelHeader={shouldShowSentToChannelHeader}
      {...props}
    />
  );
};
