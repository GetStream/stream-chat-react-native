import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateUser } from '../../../../mock-builders/generator/user';
import { AddMemberSearchResultItem } from '../../components/members/AddMemberSearchResultItem';

const renderRow = (props: React.ComponentProps<typeof AddMemberSearchResultItem>) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string, options?: Record<string, unknown>) => {
            if (options && typeof options === 'object') {
              return Object.entries(options).reduce(
                (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
                key,
              );
            }
            return key;
          }) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <AddMemberSearchResultItem {...props} />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('AddMemberSearchResultItem', () => {
  it('renders a selectable row with unselected accessibility state by default', () => {
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ isAlreadyMember: false, onPress: jest.fn(), selected: false, user });

    const row = screen.getByTestId('channel-add-members-row-u-1');
    expect(row.props.accessibilityState).toMatchObject({ disabled: false, selected: false });
    expect(screen.getByLabelText('a11y/Select Alice')).toBeTruthy();
    expect(screen.queryByTestId('channel-add-members-row-u-1-member-label')).toBeNull();
  });

  it('flips accessibilityState.selected when selected is true', () => {
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ isAlreadyMember: false, onPress: jest.fn(), selected: true, user });

    expect(
      screen.getByTestId('channel-add-members-row-u-1').props.accessibilityState,
    ).toMatchObject({ disabled: false, selected: true });
  });

  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn();
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ isAlreadyMember: false, onPress, selected: false, user });

    fireEvent.press(screen.getByTestId('channel-add-members-row-u-1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to the user id when no name is set', () => {
    const user = generateUser({ id: 'u-no-name', name: undefined });
    renderRow({ isAlreadyMember: false, onPress: jest.fn(), selected: false, user });

    expect(screen.getByLabelText('a11y/Select u-no-name')).toBeTruthy();
    expect(screen.getByText('u-no-name')).toBeTruthy();
  });

  describe('when isAlreadyMember is true', () => {
    it('renders the disabled variant with a member label and no button role', () => {
      const user = generateUser({ id: 'u-2', name: 'Bob' });
      renderRow({ isAlreadyMember: true, onPress: jest.fn(), selected: false, user });

      const row = screen.getByTestId('channel-add-members-row-u-2');
      expect(row.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
      expect(row.props.accessibilityRole).toBeUndefined();
      expect(screen.getByTestId('channel-add-members-row-u-2-member-label')).toBeTruthy();
      expect(screen.getByText('Already a member')).toBeTruthy();
      expect(screen.getByLabelText('a11y/Bob is already a member')).toBeTruthy();
    });
  });
});
