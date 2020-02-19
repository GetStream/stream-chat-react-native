import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { withLocalizationContext } from '../context';
import {
  LSK_LOADING_ERROR_INDICATOR_CHANNELS,
  LSK_LOADING_ERROR_INDICATOR_MESSAGES,
  LSK_LOADING_ERROR_INDICATOR_DEFAULT,
} from '../locale';

const LoadingErrorIndicator = ({ listType, localizedStrings }) => {
  let Loader;
  switch (listType) {
    case 'channel':
      Loader = (
        <Text>{localizedStrings[LSK_LOADING_ERROR_INDICATOR_CHANNELS]}</Text>
      );
      break;
    case 'message':
      Loader = (
        <Text>{localizedStrings[LSK_LOADING_ERROR_INDICATOR_MESSAGES]}</Text>
      );
      break;
    default:
      Loader = (
        <Text>{localizedStrings[LSK_LOADING_ERROR_INDICATOR_DEFAULT]}</Text>
      );
      break;
  }

  return Loader;
};

LoadingErrorIndicator.propTypes = {
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
};

const LoadingErrorIndicatorWithContext = withLocalizationContext(
  LoadingErrorIndicator,
);
export { LoadingErrorIndicatorWithContext as LoadingErrorIndicator };
