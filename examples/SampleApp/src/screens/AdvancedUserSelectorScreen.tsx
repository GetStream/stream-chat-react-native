import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '../context/AppContext';

const styles = StyleSheet.create({
  bottomContainer: {
    paddingHorizontal: 16,
  },
  bottomInnerContainer: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 26,
    padding: 16,
    width: '100%',
  },
  container: {
    height: '100%',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  input: {
    fontSize: 14,
    includeFontPadding: false,
    padding: 0,
    paddingTop: 0,
    textAlignVertical: 'center',
  },
  labelsContainer: { paddingHorizontal: 16, paddingTop: 8 },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  labelTextContainer: {
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  versionText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

type LabeledTextInputProps = {
  onChangeText: (text: string) => void;
  value: string;
  error?: boolean;
  label?: string;
};

export const LabeledTextInput: React.FC<LabeledTextInputProps> = ({
  error = false,
  label = '',
  onChangeText,
  value,
}) => {
  const isEmpty = value === undefined;

  return null;
};

export const AdvancedUserSelectorScreen: React.FC = () => {

  const { loginUser } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [userId, setUserId] = useState('');
  const [userIdError, setUserIdError] = useState(false);
  const [userName, setUserName] = useState('');
  const [userToken, setUserToken] = useState('');
  const [userTokenError, setUserTokenError] = useState(false);

  const isValidInput = () => {
    let isValid = true;
    if (!apiKey) {
      setApiKeyError(true);
      isValid = false;
    }

    if (!userId) {
      setUserIdError(true);
      isValid = false;
    }

    if (!userToken) {
      setUserTokenError(true);
      isValid = false;
    }

    return isValid;
  };
  return null;
};
