import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: ${({ theme }) =>
    theme.attachment.actions.container.flexDirection};
  justify-content: ${({ theme }) =>
    theme.attachment.actions.container.justifyContent};
  padding: ${({ theme }) => theme.attachment.actions.container.padding}px;
  ${({ theme }) => theme.attachment.actions.container.extra}
`;

const Button = styled(({ buttonStyle, ...rest }) => (
  <TouchableOpacity {...rest} />
))`
  background-color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.attachment.actions.button.primaryBackgroundColor
      : theme.attachment.actions.button.defaultBackgroundColor};
  border-color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.attachment.actions.button.primaryBorderColor
      : theme.attachment.actions.button.defaultBorderColor};
  border-width: ${({ theme }) => theme.attachment.actions.button.borderWidth};
  border-radius: ${({ theme }) => theme.attachment.actions.button.borderRadius};
  padding-top: ${({ theme }) => theme.attachment.actions.button.paddingTop}px;
  padding-bottom: ${({ theme }) =>
    theme.attachment.actions.button.paddingBottom}px;
  padding-left: ${({ theme }) => theme.attachment.actions.button.paddingLeft}px;
  padding-right: ${({ theme }) =>
    theme.attachment.actions.button.paddingRight}px;
  ${({ theme }) => theme.attachment.actions.button.extra}
`;

const ButtonText = styled(({ buttonStyle, ...rest }) => <Text {...rest} />)`
  color: ${({ theme, buttonStyle }) =>
    buttonStyle === 'primary'
      ? theme.attachment.actions.buttonText.primaryColor
      : theme.attachment.actions.buttonText.defaultColor};
  ${({ theme }) => theme.attachment.actions.buttonText.extra}
`;

/**
 * AttachmentActions - The actions you can take on an attachment
 *
 * @example ./docs/AttachmentActions.md
 * @extends PureComponent
 */
export const AttachmentActions = themed(
  class AttachmentActions extends React.PureComponent {
    static themePath = 'attachment.actions';
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
