import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';

import type { StackNavigatorParamList } from '../types';
import { NetworkDownIndicator } from '../components/NetworkDownIndicator';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
// Either provide channel or channelId.
export const ChannelScreen: React.FC = ({
  route: {
    params: { channel: channelFromProp, channelId, messageId },
  },
}) => {
  const { chatClient } = useAppContext();

  return (
    <View style={[styles.flex, { paddingBottom: 0 }]} />
  );
};
