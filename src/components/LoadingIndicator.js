import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { Spinner } from './Spinner';

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

export class LoadingIndicator extends React.PureComponent {
  static propTypes = {
    listType: PropTypes.oneOf(['channel', 'message', 'default']),
    loadingText: PropTypes.string,
  };

  static defaultProps = {
    listType: 'default',
  };

  render() {
    switch (this.props.listType) {
      case 'channel':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {this.props.loadingText
                ? this.props.loadingText
                : 'Loading channels ...'}
            </LoadingText>
          </Container>
        );
      case 'message':
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {this.props.loadingText
                ? this.props.loadingText
                : 'Loading messages ...'}
            </LoadingText>
          </Container>
        );
      case 'default':
      default:
        return (
          <Container>
            <Spinner />
            <LoadingText>
              {this.props.loadingText ? this.props.loadingText : 'Loading ...'}
            </LoadingText>
          </Container>
        );
    }
  }
}
