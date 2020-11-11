import React from 'react';
import { useTheme } from '@react-navigation/native';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { AppTheme } from '../types';

export const LoadingScreen = () => {
  const { colors } = useTheme() as AppTheme;
  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.background,
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
        <ActivityIndicator color={colors.text} size='small' />
      </View>
    </SafeAreaView>
  );
};
