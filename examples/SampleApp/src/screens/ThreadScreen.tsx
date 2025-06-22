import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { StackNavigatorParamList } from '../types';


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const ThreadScreen: React.FC = ({
  route: {
    params: { channel, thread },
  },
}) => {

  return (
    <View style={[styles.container]} />
  );
};
