import React, { useCallback, useEffect, useState } from 'react';
import { RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Platform, StyleSheet, View } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';

import type { StackNavigatorParamList } from '../types';
import { NetworkDownIndicator } from '../components/NetworkDownIndicator';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export type ChannelScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelScreen'
>;
export type ChannelScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelScreen'>;
export type ChannelScreenProps = {
  navigation: ChannelScreenNavigationProp;
  route: ChannelScreenRouteProp;
};

// Either provide channel or channelId.
export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  route: {
    params: { channel: channelFromProp, channelId, messageId },
  },
}) => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { paddingBottom: bottom }]} />
  );
};
