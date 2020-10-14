import React, { useEffect, useRef } from 'react';
import { Animated, GestureResponderEvent } from 'react-native';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { styled } from '../../../styles/styledComponents';

const Container = styled.TouchableOpacity`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 13px;
  height: 27px;
  justify-content: center;
  transform: translateY(9px);
  width: 112px;
  z-index: 10;
  ${({ theme }) => theme.messageList.messageNotification.container.css}
`;

const MessageNotificationText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
  ${({ theme }) => theme.messageList.messageNotification.text.css}
`;

export type MessageNotificationProps = {
  /** onPress handler */
  onPress: (event: GestureResponderEvent) => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
};

/**
 * @example ./MessageNotification.md
 */
export const MessageNotification: React.FC<MessageNotificationProps> = (
  props,
) => {
  const { onPress, showNotification = true } = props;

  const { t } = useTranslationContext();

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      duration: 500,
      toValue: showNotification ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [showNotification]);

  return showNotification ? (
    <Animated.View
      style={{
        bottom: 0,
        opacity,
        position: 'absolute',
      }}
      testID='message-notification'
    >
      <Container onPress={onPress}>
        <MessageNotificationText>{t('New Messages')}</MessageNotificationText>
      </Container>
    </Animated.View>
  ) : null;
};
