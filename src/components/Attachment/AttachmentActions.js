import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';
import registerCSS from '../../css.macro';

const Container = registerCSS(
  'message.actions.container',
  styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding: 5px;
    ${({ theme }) => theme.message.actions.container.css}
  `,
);

const Button = registerCSS(
  'message.actions.button',
  styled(({ buttonStyle, ...rest }) => <TouchableOpacity {...rest} />)`
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
    ${({ theme }) => theme.message.actions.button.css}
  `,
);

const ButtonText = registerCSS(
  'message.actions.buttonText',
  styled(({ buttonStyle, ...rest }) => <Text {...rest} />)`
    color: ${({ theme, buttonStyle }) =>
      buttonStyle === 'primary'
        ? theme.message.actions.buttonText.primaryColor
        : theme.message.actions.buttonText.defaultColor};
    ${({ theme }) => theme.message.actions.buttonText.css}
  `,
);

/**
 * AttachmentActions - The actions you can take on an attachment.
 * Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
 *
 * @example ./docs/AttachmentActions.md
 * @extends PureComponent
 */
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
  };

  render() {
    const { id, actions, actionHandler } = this.props;
    return (
      <Container>
        {actions.map((action) => (
          <Button
            key={`${id}-${action.value}`}
            buttonStyle={action.style}
            onPress={actionHandler.bind(this, action.name, action.value)}
          >
            <ButtonText buttonStyle={action.style}>{action.text}</ButtonText>
          </Button>
        ))}
      </Container>
    );
  }
}

export default themed(AttachmentActions);
