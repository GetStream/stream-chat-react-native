import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const Container = styled.View`
  flex-direction: ${(props) =>
    props.theme.attachment.actions.container.flexDirection};
  justify-content: ${(props) =>
    props.theme.attachment.actions.container.justifyContent};
  padding: ${(props) => props.theme.attachment.actions.container.padding}px;
  ${({ theme }) => theme.attachment.actions.container.extra}
`;

const Button = styled(({ buttonStyle, ...rest }) => (
  <TouchableOpacity {...rest} />
))`
  background-color: ${(props) =>
    props.buttonStyle === 'primary'
      ? props.theme.attachment.actions.button.primaryBackgroundColor
      : props.theme.attachment.actions.button.defaultBackgroundColor};
  border-color: ${(props) =>
    props.buttonStyle === 'primary'
      ? props.theme.attachment.actions.button.primaryBorderColor
      : props.theme.attachment.actions.button.defaultBorderColor};
  border-width: ${(props) => props.theme.attachment.actions.button.borderWidth};
  border-radius: ${(props) =>
    props.theme.attachment.actions.button.borderRadius};
  padding-top: ${(props) => props.theme.attachment.actions.button.paddingTop}px;
  padding-bottom: ${(props) =>
    props.theme.attachment.actions.button.paddingBottom}px;
  padding-left: ${(props) =>
    props.theme.attachment.actions.button.paddingLeft}px;
  padding-right: ${(props) =>
    props.theme.attachment.actions.button.paddingRight}px;
  ${({ theme }) => theme.attachment.actions.button.extra}
`;

const ButtonText = styled(({ buttonStyle, ...rest }) => <Text {...rest} />)`
  color: ${(props) =>
    props.buttonStyle === 'primary'
      ? props.theme.attachment.actions.buttonText.primaryColor
      : props.theme.attachment.actions.buttonText.defaultColor};
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
