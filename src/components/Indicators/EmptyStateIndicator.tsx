import React from 'react';
import { Text } from 'react-native';

type Props = {
  listType: 'channel' | 'message' | 'default';
};

const EmptyStateIndicator: React.FC<Props> = ({ listType }) => {
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

export default EmptyStateIndicator;
