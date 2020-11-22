/* eslint-disable sort-keys */
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { DrawerNavigatorParamList, StackNavigatorParamList } from '../types';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { RoundButton } from './RoundButton';
import { ScreenHeader } from './ScreenHeader';

type ChatScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;
export const ChatScreenHeader = ({ title = 'Stream Chat' }) => {
  const navigation = useNavigation<ChatScreenHeaderNavigationProp>();
  const { chatClient } = useContext(AppContext);

  return (
    <>
      <ScreenHeader
        LeftContent={() => (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Image
              source={{
                uri: chatClient?.user?.image,
              }}
              style={{
                borderRadius: 20,
                height: 40,
                width: 40,
              }}
            />
          </TouchableOpacity>
        )}
        RightContent={() => (
          <RoundButton
            onPress={() => {
              navigation.navigate('NewDirectMessagingScreen');
            }}
          >
            <NewDirectMessageIcon
              active
              color={'#006CFF'}
              height={25}
              width={25}
            />
          </RoundButton>
        )}
        title={title}
      />
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
