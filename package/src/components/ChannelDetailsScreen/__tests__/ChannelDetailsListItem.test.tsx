import React from 'react';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { ChannelDetailsListItem } from '../components/ChannelDetailsListItem';

const TestIcon = () => null;

const renderItem = (props: Partial<React.ComponentProps<typeof ChannelDetailsListItem>> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ChannelDetailsListItem Icon={TestIcon} label='Pinned Messages' {...props} />
    </ThemeProvider>,
  );

describe('ChannelDetailsListItem', () => {
  it('renders as a non-interactive row when onPress is not provided', () => {
    renderItem({ testID: 'item' });
    const row = screen.getByTestId('item');
    expect(row.props.accessibilityRole).toBeUndefined();
  });

  it('renders as a button with the label as accessibilityLabel when onPress is provided', () => {
    const onPress = jest.fn();
    renderItem({ onPress, testID: 'item' });
    const row = screen.getByTestId('item');
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe('Pinned Messages');
  });

  it('forwards accessibilityHint when provided', () => {
    renderItem({
      accessibilityHint: 'Removes you from this group',
      onPress: jest.fn(),
      testID: 'item',
    });
    expect(screen.getByTestId('item').props.accessibilityHint).toBe('Removes you from this group');
  });
});
