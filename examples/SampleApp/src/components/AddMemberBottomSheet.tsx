import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { UserSearchResultsGrid } from './UserSearch/UserSearchResultsGrid';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import {
  isAddMemberBottomSheetData,
  useBottomSheetOverlayContext,
} from '../context/BottomSheetOverlayContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';

const styles = StyleSheet.create({
  container: {
    height: 300,
  },
  flex: {
    flex: 1,
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    marginLeft: 10,
    padding: 0, // removal of default text input padding on android
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  text: {
    marginLeft: 10,
  },
  textContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
    width: '100%',
  },
});

export const AddMemberBottomSheet: React.FC = () => {
  const { setOverlay } = useAppOverlayContext();
  const { data, reset } = useBottomSheetOverlayContext();

  const channel = data && isAddMemberBottomSheetData(data) ? data.channel : undefined;

  const {
    clearText,
    loading: loadingResults,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
  } = usePaginatedUsers();

  const [addMemberQueryInProgress, setAddMemberQueryInProgress] = useState(false);
  const [error, setError] = useState(false);

  if (!channel) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: 0,
        },
      ]}
     />
  );
};
