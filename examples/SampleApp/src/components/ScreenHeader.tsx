/* eslint-disable sort-keys */
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CompositeNavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  AppTheme,
  DrawerNavigatorParamList,
  StackNavigatorParamList,
} from '../types';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';

type ScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;
export const ScreenHeader = ({ title = 'Stream Chat' }) => {
  const navigation = useNavigation<ScreenHeaderNavigationProp>();
  const insets = useSafeAreaInsets();
  const { chatClient } = useContext(AppContext);
  const { colors } = useTheme() as AppTheme;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundNavigation,
            height: 55 + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Image
            source={{
              uri: chatClient.user?.image,
            }}
            style={{
              borderRadius: 20,
              height: 40,
              width: 40,
            }}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('NewDirectMessagingScreen');
          }}
          style={styles.newDMButton}
        >
          <NewDirectMessageIcon
            active
            color={'#006CFF'}
            height={25}
            width={25}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomColor: 'rgba(0, 0, 0, 0.0677)',
    borderBottomWidth: 1,
  },
  logo: {
    height: 30,
    width: 30,
    borderRadius: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  newDMButton: {
    borderRadius: 20,
  },
});
