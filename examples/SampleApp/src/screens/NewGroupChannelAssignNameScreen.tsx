/* eslint-disable sort-keys */
import { RouteProp, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import {  ThemeProvider } from '../../../../src/v2';
import { RoundButton } from '../components/RoundButton';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { Check } from '../icons/Check';
import { GoBack } from '../icons/GoBack';
import { AppTheme, StackNavigatorParamList } from '../types';

type NewGroupChannelAssignNameScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewGroupChannelAssignNameScreen'
>;
type NewGroupChannelAssignNameScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'NewGroupChannelAssignNameScreen'
>;

export type NewGroupChannelAssignNameScreenProps = {
  navigation: NewGroupChannelAssignNameScreenNavigationProp;
  route: NewGroupChannelAssignNameScreenRouteProp;
};

export const NewGroupChannelAssignNameScreen: React.FC<NewGroupChannelAssignNameScreenProps> = ({
  navigation,
  route: {
    params: { selectedUsers },
  },
}) => {
  const { colors } = useTheme() as AppTheme;
  const { chatClient } = useContext(AppContext);
  const [groupName, setGroupName] = useState('');
  if (!chatClient) return null;

  return (
    <SafeAreaView>
      <ThemeProvider>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.backgroundNavigation,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <GoBack height={24} width={24} />
          </TouchableOpacity>
          <Text style={{ fontWeight: 'bold' }}>Name of Group Chat</Text>
          <View style={styles.backButton}>
            <RoundButton
              disabled={!groupName}
              onPress={() => {
                if (!chatClient.user || !selectedUsers || !groupName) return;

                const channel = chatClient.channel('messaging', uuidv4(), {
                  name: groupName,
                  members: [
                    ...selectedUsers.map((u) => u.id),
                    chatClient.user?.id,
                  ],
                });

                // TODO: Maybe there is a better way to do this.
                navigation.pop();
                navigation.replace('ChannelScreen', {
                  channelId: channel.id,
                });
              }}
            >
              <Check
                fill={groupName ? '#366CFF' : undefined}
                height={24}
                width={24}
              />
            </RoundButton>
          </View>
        </View>
        <View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <View
              style={[
                styles.searchContainer,
                {
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                }}
              >
                <View
                  style={[
                    styles.inputBoxContainer,
                    {
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text>Name</Text>
                  <TextInput
                    autoFocus
                    onChangeText={(text) => {
                      setGroupName(text);
                    }}
                    placeholder={'Choose a group chat name'}
                    placeholderTextColor={colors.textLight}
                    style={[
                      styles.inputBox,
                      {
                        color: colors.text,
                      },
                    ]}
                    value={groupName}
                  />
                </View>
              </View>
            </View>
            <View
              style={{
                backgroundColor: colors.backgroundFadeGradient,
                padding: 5,
                paddingLeft: 8,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                }}
              >
                {selectedUsers.length} Members
              </Text>
            </View>
            {selectedUsers && selectedUsers.length >= 0 && (
              <View style={{ flexGrow: 1, flexShrink: 1 }}>
                <UserSearchResults
                  groupedAlphabetically={false}
                  results={selectedUsers}
                  selectedUserIds={selectedUsers.map((u) => u.id)}
                  showOnlineStatus={false}
                  toggleSelectedUser={() => null}
                />
              </View>
            )}
          </View>
        </View>
      </ThemeProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    padding: 15,
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  searchContainerLabel: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 4,
    padding: 10,
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
    backgroundColor: 'white',
    alignItems: 'center'
  },
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0
  },
  searchResultContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  searchResultUserImage: {
    height: 30,
    width: 30,
    borderRadius: 20,
  },
  searchResultUserDetails: {
    paddingLeft: 8,
    flexGrow: 1,
    flexShrink: 1,
  },
  searchResultUserName: { fontSize: 14 },
  searchResultUserLastOnline: { fontSize: 12.5 },
  emptyResultIndicator: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultIndicatorEmoji: {
    fontSize: 60,
  },
  textInputContainer: {
    minWidth: 100,
    height: 32,
    margin: 4,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },

  textInput: {
    margin: 0,
    padding: 0,
    paddingLeft: 12,
    paddingRight: 12,
    height: 32,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.87)',
  },
});
