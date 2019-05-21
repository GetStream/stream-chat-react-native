import React from 'react';
import { Text } from 'react-native';

export const EmptyStateIndicator = ({ listType }) => {
  let Indicator;
  switch (listType) {
    case 'channel':
      Indicator = <Text>You have no channels currently</Text>;
      break;
    case 'message':
      Indicator = null;
      break;
    default:
      Indicator = <Text>No itens exist</Text>;
      break;
  }

  return Indicator;
};
