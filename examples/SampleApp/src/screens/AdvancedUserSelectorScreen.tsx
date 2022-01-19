import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardCompatibleView, useTheme, version } from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';

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
  const {
    theme: {
      colors: { accent_blue, accent_red, black, grey, white_smoke },
    },
  } = useTheme();
  const [borderColor, setBorderColor] = useState(white_smoke);

  const onFocus = () => {
    setBorderColor(accent_blue);
  };

  const onBlur = () => {
    setBorderColor(white_smoke);
  };

  const isEmpty = value === undefined;

  return (
    <View
      style={[
        styles.labelTextContainer,
        {
          backgroundColor: white_smoke,
          borderColor,
          borderWidth: 1,
          paddingVertical: !!value || !!error ? 16 : 8,
        },
      ]}
    >
      {!!value && (
        <Text
          style={[
            styles.labelText,
            {
              color: grey,
            },
          ]}
        >
          {label}
        </Text>
      )}
      {!!error && (
        <Text
          style={[
            styles.labelText,
            {
              color: accent_red,
            },
          ]}
        >
          Please enter {label}
        </Text>
      )}
      <TextInput
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={label}
        placeholderTextColor={grey}
        returnKeyType='next'
        style={[
          styles.input,
          {
            color: black,
            fontWeight: isEmpty ? '500' : 'normal',
          }, // design team wanted placeholder fontWeight of 500
        ]}
        value={value}
      />
    </View>
  );
};

export const AdvancedUserSelectorScreen: React.FC = () => {
  const { bottom } = useSafeAreaInsets();
  const {
    theme: {
      colors: { button_background, button_text, grey_gainsboro, white_snow },
    },
  } = useTheme();

  const { loginUser } = useContext(AppContext);
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
  return (
    <KeyboardCompatibleView keyboardVerticalOffset={0}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: white_snow,
            paddingBottom: bottom,
          },
        ]}
      >
        <ScreenHeader titleText='Advanced Options' />
        <View style={styles.innerContainer}>
          <View style={styles.labelsContainer}>
            <LabeledTextInput
              error={apiKeyError}
              label='Chat API Key'
              onChangeText={(text) => {
                setApiKeyError(false);
                setApiKey(text);
              }}
              value={apiKey}
            />
            <LabeledTextInput
              error={userIdError}
              label='User ID'
              onChangeText={(text) => {
                setUserIdError(false);
                setUserId(text);
              }}
              value={userId}
            />
            <LabeledTextInput
              error={userTokenError}
              label='User Token'
              onChangeText={(text) => {
                setUserTokenError(false);
                setUserToken(text);
              }}
              value={userToken}
            />
            <LabeledTextInput
              label='Username (optional)'
              onChangeText={(text) => {
                setUserName(text);
              }}
              value={userName}
            />
          </View>
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              onPress={async () => {
                if (!isValidInput()) return;

                try {
                  await loginUser({
                    apiKey,
                    userId,
                    userName,
                    userToken,
                  });
                } catch (e) {
                  Alert.alert(
                    'Login resulted in error. Please make sure you have entered valid credentials',
                  );
                }
              }}
              style={[
                styles.bottomInnerContainer,
                {
                  backgroundColor: button_background,
                },
              ]}
            >
              <Text
                style={{
                  color: button_text,
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.versionText,
                {
                  color: grey_gainsboro,
                },
              ]}
            >
              Stream SDK v{version}
            </Text>
          </View>
        </View>
      </View>
    </KeyboardCompatibleView>
  );
};
