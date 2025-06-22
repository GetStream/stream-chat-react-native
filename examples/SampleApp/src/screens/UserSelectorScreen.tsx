import React, { useEffect } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { USERS } from '../ChatUsers';
import { useAppContext } from '../context/AppContext';
import { RightArrow } from '../icons/RightArrow';
import { StreamLogo } from '../icons/StreamLogo';
import { Settings } from '../icons/Settings';
import AsyncStore from '../utils/AsyncStore';


import type { UserSelectorParamList } from '../types';

const styles = StyleSheet.create({
  avatarImage: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  footerText: {
    textAlign: 'center',
  },
  nameContainer: {
    marginLeft: 8,
  },
  rightArrow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 12,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'visible',
  },
  subTitle: {
    fontSize: 14,
    marginTop: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: 31,
    paddingTop: 34,
  },
  userContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export const UserSelectorScreen: React.FC = ({ navigation }) => {
  const { switchUser } = useAppContext();

  useEffect(() => {
    AsyncStore.setItem('@stream-rn-sampleapp-user-id', '');
  }, []);

  return (
    <View
      edges={['right', 'top', 'left']}
      style={[styles.container]}
      testID='user-selector-screen'
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.scrollContainer}
        testID='users-list'
      >
        <View style={styles.titleContainer}>
          <StreamLogo />
          <Text style={[styles.title]}>Welcome to Stream Chat</Text>
          <Text style={[styles.subTitle]}>
            Select a user to try the {Platform.OS === 'ios' ? 'iOS' : 'Android'} sdk:
          </Text>
        </View>

        {Object.values(USERS).map((u, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              switchUser(u.id);
            }}
            style={[styles.userContainer]}
            testID={`user-selector-button-${u.id}`}
          >
            <Image
              source={{
                uri: u.image,
              }}
              style={styles.avatarImage}
            />
            <View style={styles.nameContainer}>
              <Text
                style={[
                  styles.userName,
                ]}
              >
                {u.name}
              </Text>
            </View>
            <View style={styles.rightArrow}>
              <RightArrow height={24} width={24} />
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('AdvancedUserSelectorScreen');
          }}
          style={[styles.userContainer]}
        >
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <View
              style={{
                alignItems: 'center',
                borderRadius: 20,
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
            >
              <Settings />
            </View>
            <View style={styles.nameContainer}>
              <Text
                style={[
                  styles.userName,
                ]}
              >
                Advanced Options
              </Text>
              <Text style={}>Custom settings</Text>
            </View>
          </View>
          <View style={styles.rightArrow}>
            <RightArrow height={24} width={24} />
          </View>
        </TouchableOpacity>
      </ScrollView>
      <View
        style={[
          {
            paddingBottom: 0,
            paddingTop: 16,
          },
        ]}
       />
    </View>
  );
};
