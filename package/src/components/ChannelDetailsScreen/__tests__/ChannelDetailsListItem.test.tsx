import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import type { IconProps } from '../../../icons/utils/base';
import { ChannelDetailsListItem } from '../components/ChannelDetailsListItem';

const TestIcon = jest.fn<null, [IconProps]>(() => null);

const renderItem = (props: Partial<React.ComponentProps<typeof ChannelDetailsListItem>> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ChannelDetailsListItem Icon={TestIcon} label='Pinned Messages' {...props} />
    </ThemeProvider>,
  );

describe('ChannelDetailsListItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the provided label', () => {
      renderItem({ label: 'Mute Group' });
      expect(screen.getByText('Mute Group')).toBeTruthy();
    });

    it('renders the icon', () => {
      renderItem();
      expect(TestIcon).toHaveBeenCalled();
    });

    it('renders the trailing slot when provided', () => {
      renderItem({ trailing: <Text testID='trailing'>5</Text> });
      expect(screen.getByTestId('trailing', { includeHiddenElements: true })).toBeTruthy();
    });

    it('omits the trailing slot when not provided', () => {
      renderItem({ testID: 'item' });
      expect(screen.queryByTestId('trailing', { includeHiddenElements: true })).toBeNull();
    });
  });

  describe('interaction surface', () => {
    it('renders as a non-interactive row when onPress is not provided', () => {
      renderItem({ testID: 'item' });
      const row = screen.getByTestId('item');
      expect(row.props.accessibilityRole).toBeUndefined();
      expect(row.props.accessibilityLabel).toBeUndefined();
    });

    it('renders as a button with the label as accessibilityLabel when onPress is provided', () => {
      renderItem({ onPress: jest.fn(), testID: 'item' });
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
      expect(screen.getByTestId('item').props.accessibilityHint).toBe(
        'Removes you from this group',
      );
    });

    it('invokes onPress when the row is pressed', () => {
      const onPress = jest.fn();
      renderItem({ onPress, testID: 'item' });
      fireEvent.press(screen.getByTestId('item'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not throw when pressed without an onPress (read-only row)', () => {
      renderItem({ testID: 'item' });
      expect(() => fireEvent.press(screen.getByTestId('item'))).not.toThrow();
    });
  });

  describe('destructive variant', () => {
    const lastIconProps = () => TestIcon.mock.calls[TestIcon.mock.calls.length - 1][0];
    const labelColor = () => {
      const styles = screen.getByText('Pinned Messages').props.style as Array<
        { color?: string } | undefined
      >;
      return styles.find((s) => s?.color)?.color;
    };

    it('uses the same color for fill and stroke', () => {
      renderItem();
      const icon = lastIconProps();
      expect(icon.fill).toBe(icon.stroke);
    });

    it('paints the icon and label differently when destructive vs standard', () => {
      const { rerender } = renderItem({ destructive: false });
      const standardIcon = lastIconProps().fill;
      const standardLabelColor = labelColor();

      TestIcon.mockClear();
      rerender(
        <ThemeProvider theme={defaultTheme}>
          <ChannelDetailsListItem Icon={TestIcon} destructive label='Pinned Messages' />
        </ThemeProvider>,
      );
      const destructiveIcon = lastIconProps().fill;
      const destructiveLabelColor = labelColor();

      expect(destructiveIcon).not.toBe(standardIcon);
      expect(destructiveLabelColor).not.toBe(standardLabelColor);
      expect(destructiveIcon).toBe(destructiveLabelColor);
    });
  });

  describe('accessibility', () => {
    it('hides the trailing slot from assistive tech (label carries the announcement)', () => {
      renderItem({ testID: 'item', trailing: <Text testID='trailing'>5</Text> });
      // Hidden by default (a11y queries skip it)…
      expect(screen.queryByTestId('trailing')).toBeNull();
      // …but still present in the tree.
      expect(screen.queryByTestId('trailing', { includeHiddenElements: true })).toBeTruthy();
    });
  });
});
