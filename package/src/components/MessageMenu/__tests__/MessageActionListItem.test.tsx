// MessageActionListItem.test.tsx

import React from 'react';

import { Text } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { MessageActionListItem } from '../MessageActionListItem';

describe('MessageActionListItem', () => {
  const mockAction = jest.fn();

  const defaultProps = {
    action: mockAction,
    actionType: 'copyMessage',
    icon: <Text>Icon</Text>,
    title: 'Copy Message',
  };

  it('should render correctly with given props', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionListItem {...defaultProps} />
      </ThemeProvider>,
    );

    expect(getByText('Copy Message')).toBeTruthy();

    expect(getByText('Icon')).toBeTruthy();

    expect(getByLabelText('copyMessage action list item')).toBeTruthy();
  });

  it('should call the action callback when pressed', () => {
    const { getByLabelText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionListItem {...defaultProps} />
      </ThemeProvider>,
    );

    fireEvent.press(getByLabelText('copyMessage action list item'));

    expect(mockAction).toHaveBeenCalled();
  });
});
