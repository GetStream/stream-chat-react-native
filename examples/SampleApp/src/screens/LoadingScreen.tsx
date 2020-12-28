import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  useColorScheme,
  View,
} from 'react-native';
import { useTheme } from 'stream-chat-react-native/v2';

export const LoadingScreen = () => {
  const colorScheme = useColorScheme();
  const { theme } = useTheme();
  return (
    <SafeAreaView
      style={{
        backgroundColor:
          theme?.colors?.white_snow || colorScheme === 'dark'
            ? '#070A0D'
            : '#FCFCFC',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <ActivityIndicator
          color={
            theme?.colors?.black || colorScheme === 'dark'
              ? '#FFFFFF'
              : '#000000'
          }
          size='small'
        />
      </View>
    </SafeAreaView>
  );
};
