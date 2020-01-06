import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

export const LoadingErrorIndicator = ({ listType }) => {
  let Loader;
  switch (listType) {
    case 'channel':
      Loader = <Text>Error loading channel list ...</Text>;
      break;
    case 'message':
      Loader = <Text>Error loading messages for this channel ...</Text>;
      break;
    default:
      Loader = <Text>Error loading</Text>;
      break;
  }

  return Loader;
};

LoadingErrorIndicator.propTypes = {
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
};
