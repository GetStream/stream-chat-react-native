import React, { useContext } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { Spinner, useChatContext, useTheme } from 'stream-chat-react-native/v2';

import { RoundButton } from './RoundButton';
import { ScreenHeader } from './ScreenHeader';

import { AppContext } from '../context/AppContext';
import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';

import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { StackNavigationProp } from '@react-navigation/stack';

import type {
  DrawerNavigatorParamList,
  StackNavigatorParamList,
} from '../types';

type ChatScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;

export const NetworkDownIndicator = () => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row' }}>
      <Spinner />
      <Text
        style={{
          color: black,
          fontSize: 16,
          fontWeight: '700',
          marginLeft: 13,
        }}
      >
        Search for network
      </Text>
    </View>
  );
};

export const ChatScreenHeader = ({ title = 'Stream Chat' }) => {
  const navigation = useNavigation<ChatScreenHeaderNavigationProp>();
  const { chatClient } = useContext(AppContext);

  const { isOnline } = useChatContext();

  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

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
              color={accent_blue}
              height={25}
              width={25}
            />
          </RoundButton>
        )}
        Title={isOnline ? null : NetworkDownIndicator}
        titleText={title}
      />
    </>
  );
};
