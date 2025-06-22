import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import { RoundButton } from './RoundButton';
import { ScreenHeader } from './ScreenHeader';

import { useAppContext } from '../context/AppContext';
import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';


import type { DrawerNavigatorParamList, StackNavigatorParamList } from '../types';
import { NetworkDownIndicator } from './NetworkDownIndicator';

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
});

export const ChatScreenHeader: React.FC<{ title?: string }> = ({ title = 'Stream Chat' }) => {

  const { chatClient } = useAppContext();

  return (
    <ScreenHeader
      // eslint-disable-next-line react/no-unstable-nested-components
      LeftContent={() => (
        <TouchableOpacity onPress={() => {}}>
          <Image
            source={{
              uri: chatClient?.user?.image,
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      )}
      // eslint-disable-next-line react/no-unstable-nested-components
      RightContent={() => (
        <RoundButton
          onPress={() => {
            navigation.navigate('NewDirectMessagingScreen');
          }}
        >
          <NewDirectMessageIcon active height={25} width={25} />
        </RoundButton>
      )}
      Title={undefined}
      titleText={title}
    />
  );
};
