import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { PinHeader } from '../../../icons';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 30,
    marginTop: 5,
  },
  label: {},
});

import type { StreamChatGenerics } from '../../../types/types';

export type MessagePinnedHeaderPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'alignment' | 'message'>;

const MessagePinnedHeaderWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: MessagePinnedHeaderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, message } = props;
  const {
    theme: {
      colors: { grey },
      messageSimple: { pinnedHeader },
    },
  } = useTheme();
  const { container, label } = pinnedHeader;
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  return (
    <View
      style={[
        styles.container,
        {
          justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end',
        },
        container,
      ]}
      testID='message-pinned'
    >
      <PinHeader pathFill={grey} />
      <Text style={[{ color: grey }, styles.label, label]}>
        Pinned by{' '}
        {message?.pinned_by?.id === client?.user?.id ? t('You') : message?.pinned_by?.name}
      </Text>
    </View>
  );
};

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessagePinnedHeaderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessagePinnedHeaderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;
  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) return false;
  return true;
};

const MemoizedMessagePinnedHeader = React.memo(
  MessagePinnedHeaderWithContext,
  areEqual,
) as typeof MessagePinnedHeaderWithContext;

export type MessagePinnedHeaderProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<MessagePinnedHeaderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessagePinnedHeader = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: MessagePinnedHeaderProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, lastGroupMessage, message } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedMessagePinnedHeader
      {...{
        alignment,
        lastGroupMessage,
        message,
      }}
      {...props}
    />
  );
};

MessagePinnedHeader.displayName = 'MessagePinnedHeader{messageSimple{pinned}}';
