import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

const EmptyStateIndicator = ({ listType }) => {
  switch (listType) {
    case 'channel':
      return <Text>You have no channels currently</Text>;
    case 'message':
      return null;
    default:
      return <Text>No items exist</Text>;
  }
};

EmptyStateIndicator.propTypes = {
  // Type of list
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
};

export default EmptyStateIndicator;
