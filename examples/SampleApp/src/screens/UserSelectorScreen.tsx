import { useNavigation, useTheme } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import React from 'react';
import { useContext } from 'react';
import { useEffect } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { USERS } from '../ChatUsers';
import { AppContext } from '../context/AppContext';
import { RightArrow } from '../icons/RightArrow';
import { StreamLogo } from '../icons/StreamLogo';
import { AppTheme, DrawerNavigatorParamList } from '../types';
import AsyncStore from '../utils/AsyncStore';
import { version } from '../../node_modules/stream-chat-react-native/package.json';
export type UserSelectorScreenNavigationProp = DrawerNavigationProp<
  DrawerNavigatorParamList,
  'UserSelectorScreen'
>;

export type UserSelectorScreenProps = {
  navigation: UserSelectorScreenNavigationProp;
};

export const UserSelectorScreen: React.FC<UserSelectorScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme() as AppTheme;
  const { switchUser } = useContext(AppContext);
  useEffect(() => {
    AsyncStore.setItem('@stream-rn-sampleapp-user-id', '');
  }, []);

  return (
    <SafeAreaView>
      <View
        style={{
          backgroundColor: colors.background,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'column',
            flexGrow: 1,
            flexShrink: 1,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <StreamLogo />
          <Text
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: 'bold',
              marginTop: 20,
            }}
          >
            Welcome to Stream Chat
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 14.5,
              marginTop: 10,
            }}
          >
            Select a user to try the {Platform.OS === 'ios' ? 'iOS' : 'Android'}{' '}
            sdk:
          </Text>
          <View style={{ marginTop: 50, width: '100%' }}>
            {Object.values(USERS).map((u, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  switchUser(u.id);
                  navigation.jumpTo('HomeScreen');
                }}
                style={{
                  borderBottomColor: colors.borderLight,
                  borderBottomWidth: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  paddingLeft: 8,
                  paddingRight: 23,
                  paddingTop: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  <Image
                    source={{
                      uri: u.image,
                    }}
                    style={{
                      borderRadius: 20,
                      height: 40,
                      width: 40,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'column',
                      marginLeft: 16,
                    }}
                  >
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
                </View>
                <View style={{ height: 20, width: 20 }}>
                  <RightArrow />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={{ color: colors.footnote, textAlign: 'center' }}>
          Stream SDK v{version}
        </Text>
      </View>
    </SafeAreaView>
  );
};

/* eslint-disable sort-keys */
const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexGrow: 1,
    height: '100%',
  },
  menuContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  menuIcon: {
    height: 18,
    width: 18,
  },
  menuItem: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  menuTitle: {
    fontSize: 14.5,
    marginLeft: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
