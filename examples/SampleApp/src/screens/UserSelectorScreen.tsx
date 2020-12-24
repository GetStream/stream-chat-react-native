import React, { useContext, useEffect } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

import { USERS } from '../ChatUsers';
import { AppContext } from '../context/AppContext';
import { RightArrow } from '../icons/RightArrow';
import { StreamLogo } from '../icons/StreamLogo';
import { AppTheme } from '../types';
import AsyncStore from '../utils/AsyncStore';

import { version } from '../../node_modules/stream-chat-react-native/package.json';

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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
});

export const UserSelectorScreen: React.FC = () => {
  const { colors } = useTheme() as AppTheme;
  const { switchUser } = useContext(AppContext);

  useEffect(() => {
    AsyncStore.setItem('@stream-rn-sampleapp-user-id', '');
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.scrollContainer}
      >
        <View style={styles.titleContainer}>
          <StreamLogo />
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Stream Chat
          </Text>
          <Text style={[styles.subTitle, { color: colors.text }]}>
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
            style={[
              styles.userContainer,
              { borderBottomColor: colors.borderLight },
            ]}
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
                    color: colors.text,
                  },
                ]}
              >
                {u.name}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Stream test account
              </Text>
            </View>
            <View style={styles.rightArrow}>
              <RightArrow height={24} width={24} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.footerText}>Stream SDK v{version}</Text>
    </SafeAreaView>
  );
};
