/* eslint-disable sort-keys */
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LeftArrow } from '../icons/LeftArrow';
import { StackNavigatorParamList } from '../types';

export type NewDirectMessagingScreenProps = {
  navigation: StackNavigationProp<
    StackNavigatorParamList,
    'NewDirectMessagingScreen'
  >;
};

export const NewDirectMessagingScreen: React.FC<NewDirectMessagingScreenProps> = ({
  navigation,
}) => (
  <SafeAreaView>
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() => {
          navigation.goBack();
        }}
        style={styles.backButton}
      >
        <LeftArrow height={24} width={24} />
      </TouchableOpacity>
      <Text style={{ fontWeight: 'bold' }}>New Chat</Text>
      <View style={{ padding: 15 }} />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    padding: 15,
  },
});
