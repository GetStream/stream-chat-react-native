import React from 'react';
import { Text } from 'react-native';

export type EmptyStateProps = {
  listType?: 'channel' | 'message' | 'default';
};

export const EmptyStateIndicator: React.FC<EmptyStateProps> = ({
  listType,
}) => {
  switch (listType) {
    case 'channel':
      return (
        <Text testID='empty-channel-state'>You have no channels currently</Text>
      );
    case 'message':
      return null;
    default:
      return <Text>No items exist</Text>;
  }
};
