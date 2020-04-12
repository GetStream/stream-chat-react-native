import React from 'react';
import { View, Text } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { Spinner } from './Spinner';
import { withTranslationContext } from '../context';

const Container = styled(View)``;
const LoadingText = styled(Text)``;

class LoadingIndicator extends React.PureComponent {
  static propTypes = {
    listType: PropTypes.oneOf(['channel', 'message', 'default']),
    loadingText: PropTypes.string,
  };

  static defaultProps = {
    listType: 'default',
  };

  render() {
    const { t, listType, loadingText } = this.props;
    switch (listType) {
      case 'channel':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText ? loadingText : t('Loading channels ...')}
            </LoadingText>
          </Container>
        );
      case 'message':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText ? loadingText : t('Loading messages ...')}
            </LoadingText>
          </Container>
        );
      case 'default':
      default:
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText ? loadingText : t('Loading ...')}
            </LoadingText>
          </Container>
        );
    }
  }
}

const LoadingIndicatorWithContext = withTranslationContext(LoadingIndicator);
export { LoadingIndicatorWithContext as LoadingIndicator };
