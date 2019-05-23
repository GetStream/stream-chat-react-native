import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Container = styled.TouchableOpacity`
  display: ${(props) => props.theme.messageNotification.container.display};
  flex-direction: ${(props) =>
    props.theme.messageNotification.container.flexDirection};
  align-items: ${(props) =>
    props.theme.messageNotification.container.alignItems};
  z-index: ${(props) => props.theme.messageNotification.container.zIndex};
  margin-bottom: ${(props) =>
    props.theme.messageNotification.container.marginBottom};
`;

export class MessageNotification extends PureComponent {
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

  render() {
    if (!this.props.showNotification) {
      return null;
    } else {
      return (
        <Container onPress={this.props.onClick} onClick={this.props.onClick}>
          {this.props.children}
        </Container>
      );
    }
  }
}
