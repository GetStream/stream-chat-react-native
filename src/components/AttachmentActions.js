import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

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
    props.styleName === 'primary'
      ? getTheme(props).attachment.actions.button.primaryBackgroundColor
      : getTheme(props).attachment.actions.button.defaultBackgroundColor};
  border-color: ${(props) =>
    props.styleName === 'primary'
      ? getTheme(props).attachment.actions.button.primaryBorderColor
      : getTheme(props).attachment.actions.button.defaultBordercolor};
  border-width: ${(props) =>
    getTheme(props).attachment.actions.button.borderWidth};
  border-radius: ${(props) =>
    getTheme(props).attachment.actions.button.borderRadius};
  padding-top: ${(props) =>
    getTheme(props).attachment.actions.button.paddingTop}px;
  padding-bottom: ${(props) =>
    getTheme(props).attachment.actions.button.paddingBottom}px;
  padding-left: ${(props) =>
    getTheme(props).attachment.actions.button.paddingLeft}px;
  padding-right: ${(props) =>
    getTheme(props).attachment.actions.button.paddingRight}px;
`;

const ButtonText = styled(({ styleName, ...rest }) => <Text {...rest} />)`
  color: ${(props) =>
    props.styleName === 'primary'
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
            styleName={action.style}
            onPress={actionHandler.bind(this, action.name, action.value)}
          >
            <ButtonText styleName={action.style}>{action.text}</ButtonText>
          </Button>
        ))}
      </Container>
    );
  }
}
