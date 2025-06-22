import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';

import type { StackNavigatorParamList } from '../types';


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  route: ThreadScreenRouteProp;
};

export const ThreadScreen: React.FC<ThreadScreenProps> = ({
  route: {
    params: { channel, thread },
  },
}) => {

  return (
    <SafeAreaView style={[styles.container]} />
  );
};
