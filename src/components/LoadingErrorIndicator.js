import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

const LoadingErrorIndicator = ({ listType, t }) => {
  let Loader;
  switch (listType) {
    case 'channel':
      Loader = <Text>{t('Error loading channel list ...')}</Text>;
      break;
    case 'message':
      Loader = <Text>{t('Error loading messages for this channel ...')}</Text>;
      break;
    default:
      Loader = <Text>{t('Error loading')}</Text>;
      break;
  }

  return Loader;
};

LoadingErrorIndicator.propTypes = {
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
};

const LoadingErrorIndicatorWithContext = withTranslationContext(
  LoadingErrorIndicator,
);
export { LoadingErrorIndicatorWithContext as LoadingErrorIndicator };
