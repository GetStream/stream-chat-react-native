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

export type MessagePinnedHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessagePinnedHeader = (props: MessagePinnedHeaderProps) => {
  const { message: propMessage } = props;
  const { message: contextMessage } = useMessageContext();
  const message = propMessage || contextMessage;
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
      accessibilityLabel='Message Pinned Header'
      style={[styles.container, container]}
      testID='message-pinned'
    >
      <PinHeader fill={grey} size={16} />
      <Text style={[{ color: grey }, styles.label, label]}>
        {t('Pinned by')}{' '}
        {message?.pinned_by?.id === client?.user?.id ? t('You') : message?.pinned_by?.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginLeft: 4,
  },
});
