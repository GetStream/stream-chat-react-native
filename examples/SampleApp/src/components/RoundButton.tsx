/* eslint-disable sort-keys */
import React, { Children } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppTheme } from '../types';

type RoundButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};
export const RoundButton: React.FC<RoundButtonProps> = ({
  children,
  disabled = false,
  onPress,
}) => {
  const { colors } = useTheme() as AppTheme;
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        borderRadius: 20,
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.iconButtonBackground,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
      }}
    >
      {children}
    </TouchableOpacity>
  );
};
