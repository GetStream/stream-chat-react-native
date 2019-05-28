import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 5px;
  ${({ theme }) => theme.message.actions.container.extra}
`;

const Button = styled(({ buttonStyle, ...rest }) => (
  <TouchableOpacity {...rest} />
))`
  background-color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.button.primaryBackgroundColor
      : theme.message.actions.button.defaultBackgroundColor};
  border-color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.button.primaryBorderColor
      : theme.message.actions.button.defaultBorderColor};
  border-width: 1;
  border-radius: 20;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
  ${({ theme }) => theme.message.actions.button.extra}
`;

const ButtonText = styled(({ buttonStyle, ...rest }) => <Text {...rest} />)`
  color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.buttonText.primaryColor
      : theme.message.actions.buttonText.defaultColor};
  ${({ theme }) => theme.message.actions.buttonText.extra}
`;

/**
 * AttachmentActions - The actions you can take on an attachment
 *
 * @example ./docs/AttachmentActions.md
 * @extends PureComponent
 */
export const AttachmentActions = themed(
  class AttachmentActions extends React.PureComponent {
    static themePath = 'message.actions';
    static propTypes = {
      // /** The id of the form input */
      // id: PropTypes.string.isRequired,
      /** The text for the form input */
      text: PropTypes.string,
      /** A list of actions */
      actions: PropTypes.array.isRequired,
      /** The handler to execute after selecting an action */
      actionHandler: PropTypes.func.isRequired,
      /** Override for the styling of the component */
      style: PropTypes.object,
    };

    render() {
      const { id, actions, actionHandler, theme } = this.props;
      return (
        <Container theme={theme}>
          {actions.map((action) => (
            <Button
              key={`${id}-${action.value}`}
              buttonStyle={action.style}
              onPress={actionHandler.bind(this, action.name, action.value)}
              theme={theme}
            >
              <ButtonText theme={theme} buttonStyle={action.style}>
                {action.text}
              </ButtonText>
            </Button>
          ))}
        </Container>
      );
    }
  },
);
