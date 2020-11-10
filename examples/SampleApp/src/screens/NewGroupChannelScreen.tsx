/* eslint-disable sort-keys */
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LeftArrow } from '../icons/LeftArrow';
import { StackNavigatorParamList } from '../types';

export type NewGroupChannelScreenProps = {
  navigation: StackNavigationProp<
    StackNavigatorParamList,
    'NewGroupChannelScreen'
  >;
};

export const NewGroupChannelScreen: React.FC<NewGroupChannelScreenProps> = ({
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
      <Text style={{ fontWeight: 'bold' }}>Add Group Members</Text>
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
