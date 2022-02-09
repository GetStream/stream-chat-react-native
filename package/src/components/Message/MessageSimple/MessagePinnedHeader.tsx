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

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type MessagePinnedHeaderPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatClient>, 'alignment' | 'message'>;

const MessagePinnedHeaderWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessagePinnedHeaderPropsWithContext<StreamChatClient>,
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

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessagePinnedHeaderPropsWithContext<StreamChatClient>,
  nextProps: MessagePinnedHeaderPropsWithContext<StreamChatClient>,
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

export type MessagePinnedHeaderProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessagePinnedHeaderPropsWithContext<StreamChatClient>>;

export const MessagePinnedHeader = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessagePinnedHeaderProps<StreamChatClient>,
) => {
  const { alignment, lastGroupMessage, message } = useMessageContext<StreamChatClient>();

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
