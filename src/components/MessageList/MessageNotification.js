import React, { useContext, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import { themed } from '../../styles/theme';
import { TranslationContext } from '../../context';

const Container = styled.TouchableOpacity`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 27px;
  width: 112px;
  z-index: 10;
  margin-bottom: 0;
  border-radius: 13px;
  background-color: ${({ theme }) => theme.colors.primary};
  transform: translateY(9px);
  ${({ theme }) => theme.messageList.messageNotification.container.css}
`;

const MessageNotificationText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
  ${({ theme }) => theme.messageList.messageNotification.text.css}
`;

/**
 * @example ../docs/MessageNotification.md
 */
const MessageNotification = ({ onPress, showNotification = true }) => {
  const { t } = useContext(TranslationContext);
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: showNotification ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [showNotification]);

  if (!showNotification) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        opacity,
      }}
      testID={'message-notification'}
    >
      <Container onPress={onPress}>
        <MessageNotificationText>{t('New Messages')}</MessageNotificationText>
      </Container>
    </Animated.View>
  );
};

MessageNotification.themePath = 'messageList.messageNotification';

MessageNotification.propTypes = {
  /** If we should show the notification or not */
  showNotification: PropTypes.bool,
  /** Onclick handler */
  onPress: PropTypes.func.isRequired,
};

export default themed(MessageNotification);
