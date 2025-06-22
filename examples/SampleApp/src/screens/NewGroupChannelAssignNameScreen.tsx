import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { useAppContext } from '../context/AppContext';
import { useUserSearchContext } from '../context/UserSearchContext';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  container: {
    flex: 1,
  },
  gradient: {
    height: 24,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  header: {
    borderBottomWidth: 0,
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 16,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  memberLength: { fontSize: 12 },
  nameText: {
    fontSize: 12,
    textAlignVertical: 'center',
  },
});

type ConfirmButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

const ConfirmButton: React.FC<ConfirmButtonProps> = (props) => {
  const { disabled, onPress } = props;

  return (
    <RoundButton disabled={disabled} onPress={onPress} />
  );
};

type NewGroupChannelAssignNameScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewGroupChannelAssignNameScreen'
>;

export type NewGroupChannelAssignNameScreenProps = {
  navigation: NewGroupChannelAssignNameScreenNavigationProp;
};

export const NewGroupChannelAssignNameScreen: React.FC<NewGroupChannelAssignNameScreenProps> = ({
  navigation,
}) => {
  const { chatClient } = useAppContext();
  const { selectedUserIds, selectedUsers } = useUserSearchContext();


  const [groupName, setGroupName] = useState('');

  if (!chatClient) {
    return null;
  }

  const onConfirm = () => {
    if (!chatClient.user || !selectedUsers || !groupName) {
      return;
    }

    // TODO: Maybe there is a better way to do this.
    navigation.pop(2);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        // eslint-disable-next-line react/no-unstable-nested-components
        RightContent={() => <ConfirmButton disabled={!groupName} onPress={onConfirm} />}
        style={styles.header}
        titleText='Name of Group Chat'
      />
      <View style={styles.container}>
        <View
          style={[
            styles.inputBoxContainer,
          ]}
        >
          <Text style={[styles.nameText]}>NAME</Text>
          <TextInput
            autoFocus
            onChangeText={setGroupName}
            placeholder='Choose a group chat name'
            style={[
              styles.inputBox,
            ]}
            value={groupName}
          />
        </View>
        <View style={styles.gradient}>
          <Text
            style={[
              styles.memberLength,
            ]}
          >
            {selectedUsers.length} Members
          </Text>
        </View>
        {selectedUsers.length >= 0 && (
          <UserSearchResults
            groupedAlphabetically={false}
            removeOnPressOnly
            results={selectedUsers}
            showOnlineStatus={false}
          />
        )}
      </View>
    </View>
  );
};
