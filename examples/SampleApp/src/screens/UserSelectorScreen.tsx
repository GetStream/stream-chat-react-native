import React, { useContext, useEffect } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native';

import { USERS } from '../ChatUsers';
import { AppContext } from '../context/AppContext';
import { RightArrow } from '../icons/RightArrow';
import { StreamLogo } from '../icons/StreamLogo';
import { Settings } from '../icons/Settings';
import AsyncStore from '../utils/AsyncStore';

import { version } from '../../node_modules/stream-chat-react-native/package.json';

import type { StackNavigationProp } from '@react-navigation/stack';

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

export type UserSelectorScreenNavigationProp = StackNavigationProp<
  UserSelectorParamList,
  'UserSelectorScreen'
>;

type Props = {
  navigation: UserSelectorScreenNavigationProp;
};

export const UserSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const {
    theme: {
      colors: { black, border, grey, grey_gainsboro, grey_whisper, white_snow },
    },
  } = useTheme();
  const { switchUser } = useContext(AppContext);

  useEffect(() => {
    AsyncStore.setItem('@stream-rn-sampleapp-user-id', '');
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: white_snow }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.scrollContainer}
      >
        <View style={styles.titleContainer}>
          <StreamLogo />
          <Text style={[styles.title, { color: black }]}>
            Welcome to Stream Chat
          </Text>
          <Text style={[styles.subTitle, { color: black }]}>
            Select a user to try the {Platform.OS === 'ios' ? 'iOS' : 'Android'}{' '}
            sdk:
          </Text>
        </View>

        {Object.values(USERS).map((u, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              switchUser(u.id);
            }}
            style={[styles.userContainer, { borderBottomColor: border }]}
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
                  {
                    color: black,
                  },
                ]}
              >
                {u.name}
              </Text>
              <Text style={{ color: grey }}>Stream test account</Text>
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
          style={[styles.userContainer, { borderBottomColor: border }]}
        >
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <View
              style={{
                alignItems: 'center',
                backgroundColor: grey_whisper,
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
                  {
                    color: black,
                  },
                ]}
              >
                Advanced Options
              </Text>
              <Text style={{ color: grey }}>Custom settings</Text>
            </View>
          </View>
          <View style={styles.rightArrow}>
            <RightArrow height={24} width={24} />
          </View>
        </TouchableOpacity>
      </ScrollView>
      <Text style={[styles.footerText, { color: grey_gainsboro }]}>
        Stream SDK v{version}
      </Text>
    </SafeAreaView>
  );
};
