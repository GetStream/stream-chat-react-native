import React from 'react';
import { Text } from 'react-native';

export const LoadingIndicator = ({ listType }) => {
  let Loader;
  switch (listType) {
    case 'channel':
      Loader = <Text>Loading channel list ...</Text>;
      break;
    case 'message':
      Loader = <Text>Loading messages ...</Text>;
      break;
    default:
      Loader = <Text>Loading ...</Text>;
      break;
  }

  return Loader;
};
