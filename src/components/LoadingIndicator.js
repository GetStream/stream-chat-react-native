import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { Spinner } from './Spinner';
import { withLocalizationContext } from '../context';
import {
  LSK_LOADING_INDICATOR_LOADING_CHANNELS,
  LSK_LOADING_INDICATOR_LOADING_MESSAGES,
  LSK_LOADING_INDICATOR_LOADING_DEFAULT,
} from '../locale';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.loadingIndicator.container.css}
`;
const LoadingText = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  font-weight: 600;
  ${({ theme }) => theme.loadingIndicator.loadingText.css}
`;

class LoadingIndicator extends React.PureComponent {
  static propTypes = {
    listType: PropTypes.oneOf(['channel', 'message', 'default']),
    loadingText: PropTypes.string,
  };

  static defaultProps = {
    listType: 'default',
  };

  render() {
    const { localizedStrings, listType, loadingText } = this.props;
    switch (listType) {
      case 'channel':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText
                ? loadingText
                : localizedStrings[LSK_LOADING_INDICATOR_LOADING_CHANNELS]}
            </LoadingText>
          </Container>
        );
      case 'message':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText
                ? loadingText
                : localizedStrings[LSK_LOADING_INDICATOR_LOADING_MESSAGES]}
            </LoadingText>
          </Container>
        );
      case 'default':
      default:
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {loadingText
                ? loadingText
                : localizedStrings[LSK_LOADING_INDICATOR_LOADING_DEFAULT]}
            </LoadingText>
          </Container>
        );
    }
  }
}

const LoadingIndicatorWithContext = withLocalizationContext(LoadingIndicator);

export { LoadingIndicatorWithContext as LoadingIndicator };
