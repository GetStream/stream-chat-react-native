import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { themed } from '../../styles/theme';

const Container = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 5px;
  ${({ theme }) => theme.message.actions.container.css}
`;

const ActionButton = styled(({ buttonStyle, ...rest }) => (
  <TouchableOpacity {...rest} />
))`
  background-color: ${({ buttonStyle, theme }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.button.primaryBackgroundColor
      : theme.message.actions.button.defaultBackgroundColor};
  border-color: ${({ buttonStyle, theme }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.button.primaryBorderColor
      : theme.message.actions.button.defaultBorderColor};
  border-radius: 20px;
  border-width: 1px;
  padding-horizontal: 10px;
  padding-vertical: 5px;
  ${({ theme }) => theme.message.actions.button.css}
`;

const ActionButtonText = styled(({ buttonStyle, ...rest }) => (
  <Text {...rest} />
))`
  color: ${({ buttonStyle, theme }) =>
    buttonStyle === 'primary'
      ? theme.message.actions.buttonText.primaryColor
      : theme.message.actions.buttonText.defaultColor};
  ${({ theme }) => theme.message.actions.buttonText.css}
`;

/**
 * AttachmentActions - The actions you can take on an attachment.
 * Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
 *
 * @example ../docs/AttachmentActions.md
 */
const AttachmentActions = ({ actionHandler, actions, id }) => (
  <Container testID='attachment-actions'>
    {actions.map((action) => (
      <ActionButton
        buttonStyle={action.style}
        key={`${id}-${action.value}`}
        onPress={() => actionHandler(action.name, action.value)}
        testID={`attachment-actions-button-${action.name}`}
      >
        <ActionButtonText buttonStyle={action.style}>
          {action.text}
        </ActionButtonText>
      </ActionButton>
    ))}
  </Container>
);

AttachmentActions.propTypes = {
  /** The handler to execute after selecting an action */
  actionHandler: PropTypes.func.isRequired,
  /** A list of actions */
  actions: PropTypes.array.isRequired,
  // /** The id of the form input */
  id: PropTypes.string,
  /** The text for the form input */
  text: PropTypes.string,
};

AttachmentActions.themePath = 'message.actions';

export default themed(AttachmentActions);
