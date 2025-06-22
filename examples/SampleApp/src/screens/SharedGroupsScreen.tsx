import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useAppContext } from '../context/AppContext';
import { Contacts } from '../icons/Contacts';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyListContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyListSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyListTitle: {
    fontSize: 16,
    marginTop: 10,
  },
  groupContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nameText: {
    fontWeight: '700',
    marginLeft: 8,
  },
  previewContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
});

type SharedGroupsScreenRouteProp = RouteProp<StackNavigatorParamList, 'SharedGroupsScreen'>;

type SharedGroupsScreenProps = {
  route: SharedGroupsScreenRouteProp;
};

export const SharedGroupsScreen: React.FC<SharedGroupsScreenProps> = ({
  route: {
    params: { user },
  },
}) => {
  const { chatClient } = useAppContext();

  if (!chatClient?.user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titleText='Shared Groups' />
    </View>
  );
};
