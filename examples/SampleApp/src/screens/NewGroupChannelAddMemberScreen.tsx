import React from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { UserGridItem } from '../components/UserSearch/UserGridItem';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { useAppContext } from '../context/AppContext';
import { useUserSearchContext } from '../context/UserSearchContext';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: { paddingBottom: 16 },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 16,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  navigationButton: {
    paddingRight: 8,
  },
  userGridItemContainer: { marginHorizontal: 8, width: 64 },
});

type RightArrowButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

const RightArrowButton: React.FC<RightArrowButtonProps> = (props) => {
  const { disabled, onPress } = props;



  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={styles.navigationButton} />
  );
};
export const NewGroupChannelAddMemberScreen: React.FC = ({ navigation }) => {
  const { chatClient } = useAppContext();


  const { onChangeSearchText, onFocusInput, removeUser, reset, searchText, selectedUsers } =
    useUserSearchContext();

  const onRightArrowPress = () => {
    if (selectedUsers.length === 0) {
      return;
    }
    navigation.navigate('NewGroupChannelAssignNameScreen');
  };

  if (!chatClient) {
    return null;
  }

  return null;
};
