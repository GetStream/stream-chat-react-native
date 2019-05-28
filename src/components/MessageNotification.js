import React, { PureComponent } from 'react';
import { Animated } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

const Container = styled.TouchableOpacity`
  display: ${({ theme }) => theme.messageNotification.container.display};
  flex-direction: ${({ theme }) =>
    theme.messageNotification.container.flexDirection};
  align-items: ${({ theme }) => theme.messageNotification.container.alignItems};
  z-index: ${({ theme }) => theme.messageNotification.container.zIndex};
  margin-bottom: ${({ theme }) =>
    theme.messageNotification.container.marginBottom};
  ${({ theme }) => theme.messageNotification.container.extra}
`;

export class MessageNotification extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      notificationOpacity: new Animated.Value(0),
    };
  }
  static propTypes = {
    /** If we should show the notification or not */
    showNotification: PropTypes.bool,
    /** Onclick handler */
    onClick: PropTypes.func.isRequired,
    /** Style overrides */
    style: PropTypes.object,
  };

  static defaultProps = {
    showNotification: true,
  };

  componentDidMount() {
    Animated.timing(this.state.notificationOpacity, {
      toValue: this.props.showNotification ? 1 : 0,
      duration: 500,
    }).start();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.showNotification !== this.props.showNotification) {
      Animated.timing(this.state.notificationOpacity, {
        toValue: this.props.showNotification ? 1 : 0,
        duration: 500,
      }).start();
    }
  }

  render() {
    if (!this.props.showNotification) {
      return null;
    } else {
      return (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            opacity: this.state.notificationOpacity,
          }}
        >
          <Container onPress={this.props.onClick} onClick={this.props.onClick}>
            {this.props.children}
          </Container>
        </Animated.View>
      );
    }
  }
}
