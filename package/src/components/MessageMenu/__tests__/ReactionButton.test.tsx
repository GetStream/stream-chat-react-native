import React from 'react';

import { Text } from 'react-native';

import { cleanup, fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { IconProps } from '../../../icons';
import { ReactionButton } from '../ReactionButton';

const MockIcon = (props: IconProps) => <Text>{props?.pathFill?.toString() || ''}</Text>;

describe('ReactionButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const mockOnPress = jest.fn();

  const defaultProps = {
    Icon: MockIcon,
    onPress: mockOnPress,
    selected: false,
    type: 'like',
  };

  it('should render correctly with given props', () => {
    const { getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <ReactionButton {...defaultProps} />
      </ThemeProvider>,
    );

    // Check if the unselected pathFill color is rendered by the mock Icon
    expect(
      getByText(defaultTheme.messageMenu.reactionButton.unfilledColor.toString()),
    ).toBeTruthy();
  });

  it('should call onPress function with the correct reaction type when pressed', () => {
    const { getByLabelText } = render(
      <ThemeProvider theme={defaultTheme}>
        <ReactionButton {...defaultProps} />
      </ThemeProvider>,
    );

    // Simulate a press event
    fireEvent.press(getByLabelText('reaction-button-like-unselected'));

    // Verify if the mock function has been called with the correct reaction type
    expect(mockOnPress).toHaveBeenCalledWith('like');
  });

  it('should not call onPress when the onPress prop is not provided', () => {
    const { getByLabelText } = render(
      <ThemeProvider theme={defaultTheme}>
        <ReactionButton {...defaultProps} onPress={undefined} />
      </ThemeProvider>,
    );

    fireEvent.press(getByLabelText('reaction-button-like-unselected'));

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should apply selected styles correctly when selected is true', () => {
    const { getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <ReactionButton {...defaultProps} selected={true} />
      </ThemeProvider>,
    );

    expect(getByText(defaultTheme.messageMenu.reactionButton.filledColor.toString())).toBeTruthy();
  });
});
