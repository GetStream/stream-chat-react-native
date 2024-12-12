// MessageActionList.test.tsx

import React from 'react';

import { Text } from 'react-native';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { MessageActionList } from '../MessageActionList';
import { MessageActionListItemProps } from '../MessageActionListItem';

const MockMessageActionListItem = (props: MessageActionListItemProps) => <Text>{props.title}</Text>;

const defaultProps = {
  MessageActionListItem: MockMessageActionListItem,
  messageActions: [
    { action: jest.fn(), actionType: 'copyMessage', title: 'Copy Message' },
    { action: jest.fn(), actionType: 'deleteMessage', title: 'Delete Message' },
  ],
};

describe('MessageActionList', () => {
  it('should render correctly with provided message actions', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionList {...defaultProps} />
      </ThemeProvider>,
    );

    expect(getByLabelText('Message action list')).toBeTruthy();

    expect(getByText('Copy Message')).toBeTruthy();
    expect(getByText('Delete Message')).toBeTruthy();
  });

  it('should pass the correct props to MessageActionListItem', () => {
    const { getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionList {...defaultProps} />
      </ThemeProvider>,
    );

    expect(getByText('Copy Message')).toBeTruthy();
    expect(getByText('Delete Message')).toBeTruthy();
  });
});
