import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from 'react-native';

import { useAppContext } from '../context/AppContext';
import { SecretMenu } from './SecretMenu.tsx';

import type { DrawerContentComponentProps } from '@react-navigation/drawer';

export const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 16,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
});

export const MenuDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const [secretMenuPressCounter, setSecretMenuPressCounter] = useState(0);
  const [secretMenuVisible, setSecretMenuVisible] = useState(false);

  useEffect(() => {
    if (!secretMenuVisible && secretMenuPressCounter >= 7) {
      setSecretMenuVisible(true);
    }
  }, [secretMenuVisible, secretMenuPressCounter]);

  const closeSecretMenu = useCallback(() => {
    setSecretMenuPressCounter(0);
    setSecretMenuVisible(false);
  }, []);

  const { chatClient, logout } = useAppContext();

  if (!chatClient) {
    return null;
  }

  return (
    <View style={[styles.container]}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable onPress={() => setSecretMenuPressCounter(c => c + 1)} style={[styles.userRow]}>
          <Image
            source={{
              uri: chatClient.user?.image,
            }}
            style={styles.avatar}
          />
          <Text
            style={[
              styles.userName,
            ]}
          >
            {chatClient.user?.name}
          </Text>
        </Pressable>
        <View style={styles.menuContainer}>
          <View>
            <SecretMenu visible={secretMenuVisible} close={closeSecretMenu} chatClient={chatClient} />
            <TouchableOpacity
              onPress={() => navigation.navigate('NewDirectMessagingScreen')}
              style={styles.menuItem}
            >
              <Text
                style={[
                  styles.menuTitle,
                ]}
              >
                New Direct Messages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewGroupChannelAddMemberScreen')}
              style={styles.menuItem}
            >
              <Text
                style={[
                  styles.menuTitle,
                ]}
              >
                New Group
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              logout();
            }}
            style={styles.menuItem}
          >
            <Text
              style={[
                styles.menuTitle,
              ]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};
