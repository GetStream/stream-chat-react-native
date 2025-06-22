import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const presenceIndicator = { cx: 7, cy: 7, r: 5 };

const styles = StyleSheet.create({
  presenceIndicatorContainer: {
    bottom: 0,
    height: 14,
    right: 8,
    top: undefined,
    width: 14,
  },
  selectedUserItemContainer: {
    alignItems: 'center',
  },
  selectedUserItemName: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 8,
    textAlign: 'center',
  },
  selectedUserRemoveIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
  },
});

export type UserGridItemProps = {
  onPress: () => void;
  user: unknown;
  removeButton?: boolean;
};

export const UserGridItem: React.FC<UserGridItemProps> = ({
  onPress,
  removeButton = true,
  user,
}) => {
  return (
    null
  );
};
