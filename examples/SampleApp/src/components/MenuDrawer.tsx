import React, { useCallback, useEffect, useState } from 'react';
import {
  I18nManager,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Edit, useTheme } from 'stream-chat-react-native';

import { useAppContext } from '../context/AppContext';
import { SecretMenu } from './SecretMenu.tsx';

import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Group } from '../icons/Group.tsx';
import { User } from '../icons/User';
import { useLegacyColors } from '../theme/useLegacyColors';

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
  menuItemContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginStart: 16,
  },
  rtlDescription: {
    fontSize: 12,
    marginStart: 16,
    marginTop: 2,
  },
  rtlMenuItem: {
    justifyContent: 'space-between',
  },
  rtlMenuItemContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  rtlTextContainer: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginStart: 16,
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
  const isRTL = I18nManager.isRTL;
  useTheme();
  const { black, grey, white } = useLegacyColors();

  useEffect(() => {
    if (!secretMenuVisible && secretMenuPressCounter >= 7) {
      setSecretMenuVisible(true);
    }
  }, [secretMenuVisible, secretMenuPressCounter]);

  const closeSecretMenu = useCallback(() => {
    setSecretMenuPressCounter(0);
    setSecretMenuVisible(false);
  }, []);

  const { chatClient, logout, rtlEnabled, setRTLEnabled } = useAppContext();

  if (!chatClient) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: white }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={() => setSecretMenuPressCounter((c) => c + 1)}
          style={[styles.userRow, isRTL && styles.rowReverse]}
        >
          <Image
            source={{
              uri: chatClient.user?.image,
            }}
            style={styles.avatar}
          />
          <Text
            style={[
              styles.userName,
              isRTL && { textAlign: 'right' },
              {
                color: black,
              },
            ]}
          >
            {chatClient.user?.name}
          </Text>
        </Pressable>
        <View style={styles.menuContainer}>
          <View>
            <SecretMenu
              visible={secretMenuVisible}
              close={closeSecretMenu}
              chatClient={chatClient}
            />
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('HomeScreen', {
                  screen: 'NewDirectMessagingScreen',
                })
              }
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <Edit height={24} stroke={grey} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  isRTL && { textAlign: 'right' },
                  {
                    color: black,
                  },
                ]}
              >
                New Direct Messages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('HomeScreen', {
                  screen: 'NewGroupChannelAddMemberScreen',
                })
              }
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <Group height={24} pathFill={grey} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  isRTL && { textAlign: 'right' },
                  {
                    color: black,
                  },
                ]}
              >
                New Group
              </Text>
            </TouchableOpacity>
            <View
              style={[
                styles.menuItem,
                styles.rtlMenuItem,
                isRTL && styles.rowReverse,
              ]}
            >
              <View
                style={[
                  styles.rtlMenuItemContent,
                  isRTL && styles.rowReverse,
                ]}
              >
                <User height={24} pathFill={grey} width={24} />
                <View style={styles.rtlTextContainer}>
                  <Text
                    style={[
                      styles.menuTitle,
                      isRTL && { textAlign: 'right' },
                      {
                        color: black,
                      },
                    ]}
                  >
                    RTL Layout
                  </Text>
                  <Text
                    style={[
                      styles.rtlDescription,
                      isRTL && { textAlign: 'right' },
                      {
                        color: grey,
                      },
                    ]}
                  >
                    Enable RTL layout
                  </Text>
                </View>
              </View>
              <Switch
                onValueChange={setRTLEnabled}
                thumbColor={white}
                trackColor={{
                  false: grey,
                  true: black,
                }}
                value={rtlEnabled}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              logout();
            }}
            style={[styles.menuItem, isRTL && styles.rowReverse]}
          >
            <User height={24} pathFill={grey} width={24} />
            <Text
              style={[
                styles.menuTitle,
                isRTL && { textAlign: 'right' },
                {
                  color: black,
                },
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
