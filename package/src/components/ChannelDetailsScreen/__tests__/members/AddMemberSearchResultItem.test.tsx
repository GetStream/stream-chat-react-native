import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { UserResponse } from 'stream-chat';

import { ChannelAddMembersContext } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { useIsChannelMember } from '../../../../hooks/useIsChannelMember';
import { generateUser } from '../../../../mock-builders/generator/user';
import { SelectionStore } from '../../../../state-store/selection-store';
import { AddMemberSearchResultItem } from '../../components/members/AddMemberSearchResultItem';

jest.mock('../../../../hooks/useIsChannelMember', () => ({
  useIsChannelMember: jest.fn(),
}));

const mockedUseIsChannelMember = useIsChannelMember as jest.MockedFunction<
  typeof useIsChannelMember
>;

type RenderRowOptions = {
  isAlreadyMember?: boolean;
  onPress?: (user: UserResponse) => void;
  selected?: boolean;
  user: UserResponse;
};

const renderRow = ({
  isAlreadyMember = false,
  onPress = jest.fn(),
  selected = false,
  user,
}: RenderRowOptions) => {
  mockedUseIsChannelMember.mockReturnValue(isAlreadyMember);
  const selectionStore = new SelectionStore();
  if (selected) {
    selectionStore.select(user.id);
  }
  return render(
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
        <ChannelAddMembersContext.Provider value={{ selectionStore } as never}>
          <AddMemberSearchResultItem onPress={onPress} user={user} />
        </ChannelAddMembersContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );
};

describe('AddMemberSearchResultItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a selectable row with unselected accessibility state by default', () => {
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ user });

    const row = screen.getByTestId('channel-add-members-row-u-1');
    expect(row.props.accessibilityState).toMatchObject({ disabled: false, selected: false });
    expect(screen.getByLabelText('a11y/Select Alice')).toBeTruthy();
    expect(screen.queryByTestId('channel-add-members-row-u-1-member-label')).toBeNull();
  });

  it('flips accessibilityState.selected when the user is selected in the store', () => {
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ selected: true, user });

    expect(
      screen.getByTestId('channel-add-members-row-u-1').props.accessibilityState,
    ).toMatchObject({ disabled: false, selected: true });
  });

  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn();
    const user = generateUser({ id: 'u-1', name: 'Alice' });
    renderRow({ onPress, user });

    fireEvent.press(screen.getByTestId('channel-add-members-row-u-1'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(user);
  });

  it('falls back to the user id when no name is set', () => {
    const user = generateUser({ id: 'u-no-name', name: undefined });
    renderRow({ user });

    expect(screen.getByLabelText('a11y/Select u-no-name')).toBeTruthy();
    expect(screen.getByText('u-no-name')).toBeTruthy();
  });

  describe('when the user is already a member', () => {
    it('renders the disabled variant with a member label and no button role', () => {
      const user = generateUser({ id: 'u-2', name: 'Bob' });
      renderRow({ isAlreadyMember: true, user });

      const row = screen.getByTestId('channel-add-members-row-u-2');
      expect(row.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
      expect(row.props.accessibilityRole).toBeUndefined();
      expect(screen.getByTestId('channel-add-members-row-u-2-member-label')).toBeTruthy();
      expect(screen.getByText('Already a member')).toBeTruthy();
      expect(screen.getByLabelText('a11y/Bob is already a member')).toBeTruthy();
    });
  });
});
