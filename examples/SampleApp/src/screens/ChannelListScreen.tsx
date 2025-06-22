import React, { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { ChannelPreview } from '../components/ChannelPreview';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { useAppContext } from '../context/AppContext';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';


const styles = StyleSheet.create({
  channelListContainer: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyIndicatorText: { paddingTop: 28 },
  flex: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 10,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
});

const baseFilters = {
  archived: false,
  type: 'messaging',
};

const sort = [
  { pinned_at: -1 },
  { last_message_at: -1 },
  { updated_at: -1 },
];

const options = {
  presence: true,
  state: true,
  watch: true,
};

const HeaderNetworkDownIndicator = () => null;

export const ChannelListScreen: React.FC = () => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation();

  return null;
};
