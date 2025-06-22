import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

import type { StackNavigatorParamList } from '../../types';

dayjs.extend(calendar);

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 },
  date: {
    fontSize: 12,
    marginLeft: 2,
    textAlign: 'right',
  },
  detailsText: { fontSize: 12 },
  flex: { flex: 1 },
  indicatorContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  itemContainer: {
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  message: {
    flexShrink: 1,
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  title: { fontSize: 14, fontWeight: '700' },
  titleContainer: {},
});

export type MessageSearchListProps = {
  EmptySearchIndicator: React.ComponentType;
  loading: boolean;
  loadMore: () => void;
  messages: undefined;
  refreshing?: boolean;
  refreshList?: () => void;
  showResultCount?: boolean;
};
export const MessageSearchList: React.FC<MessageSearchListProps> = React.forwardRef(
  (props, scrollRef: React.Ref<null>) => {
    const {
      EmptySearchIndicator,
      loading,
      loadMore,
      messages,
      refreshing,
      refreshList,
      showResultCount = false,
    } = props;
    const navigation =
      useNavigation<NavigationProp<StackNavigatorParamList, 'ChannelListScreen'>>();

    if (!messages && !refreshing) {
      return null;
    }

    return null;
  },
);
