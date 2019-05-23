import React from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import { getTheme } from '../styles/theme';

const Container = styled.View`
  flex-direction: ${(props) =>
    getTheme(props).attachment.actions.container.flexDirection};
  justify-content: ${(props) =>
    getTheme(props).attachment.actions.container.justifyContent};
  padding: ${(props) => getTheme(props).attachment.actions.container.padding}px;
`;

const Button = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.style === 'primary'
      ? props.style.theme.attachment.actions.primaryBackgroundColor
      : props.style.theme.attachment.actions.defaultBackgroundColor};
  bordercolor: ${(props) =>
    props.style === 'primary'
      ? props.style.theme.attachment.actions.primaryBorderColor
      : props.style.theme.attachment.actions.defaultBordercolor};
  border-width: ${(props) => getTheme(props).attachment.actions.button};
  border-radius: ${(props) => getTheme(props).attachment.actions.button};
  padding-top: ${(props) => getTheme(props).attachment.actions.button}px;
  padding-bottom: ${(props) => getTheme(props).attachment.actions.button}px;
  padding-left: ${(props) => getTheme(props).attachment.actions.button}px;
  padding-right: ${(props) => getTheme(props).attachment.actions.button}px;
`;

const ButtonText = styled.Text`
  color: ${(props) =>
    props.style === 'primary'
      ? getTheme(props).attachment.actions.buttonText.primaryColor
      : getTheme(props).attachment.actions.buttonText.defaultColor};
`;

/**
 * AttachmentActions - The actions you can take on an attachment
 *
 * @example ./docs/AttachmentActions.md
 * @extends PureComponent
 */
export class AttachmentActions extends React.PureComponent {
  static propTypes = {
    // /** The id of the form input */
    // id: PropTypes.string.isRequired,
    /** The text for the form input */
    text: PropTypes.string,
    /** A list of actions */
    actions: PropTypes.array.isRequired,
    /** The handler to execute after selecting an action */
    actionHandler: PropTypes.func.isRequired,
  };

  render() {
    const { id, actions, actionHandler } = this.props;

    return (
      <Container>
        {actions.map((action) => (
          <Button
            key={`${id}-${action.value}`}
            style={action.style}
            onPress={actionHandler.bind(this, action.name, action.value)}
          >
            <ButtonText style={action.style}>{action.text}</ButtonText>
          </Button>
        ))}
      </Container>
    );
  }
}
