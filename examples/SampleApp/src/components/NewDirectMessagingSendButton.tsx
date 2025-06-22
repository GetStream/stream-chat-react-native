import React from 'react';
import { Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';

import { NewDirectMessagingScreenNavigationProp } from '../screens/NewDirectMessagingScreen';

import { useUserSearchContext } from '../context/UserSearchContext';
import { useAppContext } from '../context/AppContext';

const SendButtonWithContext = (
  props,
) => {
  const { disabled = false, giphyActive, sendMessage } = props;


  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={sendMessage}
      testID='send-button'
     />
  );
};

const areEqual = (
  prevProps,
  nextProps,
) => {
  const {
    disabled: prevDisabled,
    giphyActive: prevGiphyActive,
    sendMessage: prevSendMessage,
  } = prevProps;
  const {
    disabled: nextDisabled,
    giphyActive: nextGiphyActive,
    sendMessage: nextSendMessage,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) {
    return false;
  }

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) {
    return false;
  }

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) {
    return false;
  }

  return true;
};

const MemoizedNewDirectMessagingSendButton = React.memo(
  SendButtonWithContext,
  areEqual,
) as typeof SendButtonWithContext;


/**
 * UI Component for send button in MessageInput component.
 */
export const NewDirectMessagingSendButton = (props) => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation<NewDirectMessagingScreenNavigationProp>();
  const { selectedUserIds, reset } = useUserSearchContext();

  return null;
};
