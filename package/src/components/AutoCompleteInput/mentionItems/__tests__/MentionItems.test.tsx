import React from 'react';

import { cleanup, render } from '@testing-library/react-native';

// UserAvatar pulls in ComponentsContext defaults which transitively load
// stream-chat-js's CJS dist; that fails to resolve @babel/runtime when the
// SDK is consumed from a workspace symlink during tests. The avatar itself
// isn't what we assert on here, so substitute a no-op.
jest.mock('../../../ui/Avatar/UserAvatar', () => ({
  UserAvatar: () => null,
}));

// Same reason — useMessageComposer (used by AutoCompleteSuggestionItem) pulls
// stream-chat-js's CJS dist at module load. The dispatcher we're testing
// doesn't use these hooks itself, so stub them.
jest.mock('../../../../contexts/messageInputContext/hooks/useMessageComposer', () => ({
  useMessageComposer: () => ({ textComposer: { handleSelect: () => {} } }),
}));
jest.mock('../../../../contexts/messageInputContext/hooks/useIsCommandDisabled', () => ({
  useIsCommandDisabled: () => false,
}));

import type {
  ChannelMentionSuggestion,
  HereMentionSuggestion,
  RoleMentionSuggestion,
  UserGroupMentionSuggestion,
  UserSuggestion,
} from 'stream-chat';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { MentionSuggestionItem } from '../../AutoCompleteSuggestionItem';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={defaultTheme}>{ui}</ThemeProvider>);

const userEntity: UserSuggestion = {
  id: 'u1',
  mentionType: 'user',
  name: 'Alice',
  tokenizedDisplayName: { parts: ['Alice'], token: '' },
} as unknown as UserSuggestion;

const channelEntity: ChannelMentionSuggestion = {
  id: 'channel',
  mentionType: 'channel',
  name: 'channel',
  tokenizedDisplayName: { parts: ['channel'], token: '' },
} as unknown as ChannelMentionSuggestion;

const hereEntity: HereMentionSuggestion = {
  id: 'here',
  mentionType: 'here',
  name: 'here',
  tokenizedDisplayName: { parts: ['here'], token: '' },
} as unknown as HereMentionSuggestion;

const roleEntity: RoleMentionSuggestion = {
  id: 'admin',
  mentionType: 'role',
  name: 'admin',
  tokenizedDisplayName: { parts: ['admin'], token: '' },
} as unknown as RoleMentionSuggestion;

const groupEntity: UserGroupMentionSuggestion = {
  description: 'Engineering org',
  id: 'eng',
  memberCount: 42,
  mentionType: 'user_group',
  name: 'engineering',
  tokenizedDisplayName: { parts: ['engineering'], token: '' },
} as unknown as UserGroupMentionSuggestion;

describe('MentionSuggestionItem', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a user row with the display name', () => {
    const { getByText } = wrap(<MentionSuggestionItem {...userEntity} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders a broadcast row for @channel with description subtitle', () => {
    const { getByText } = wrap(<MentionSuggestionItem {...channelEntity} />);
    expect(getByText('@channel')).toBeTruthy();
    expect(getByText('mention/Channel Description')).toBeTruthy();
  });

  it('renders a broadcast row for @here with description subtitle', () => {
    const { getByText } = wrap(<MentionSuggestionItem {...hereEntity} />);
    expect(getByText('@here')).toBeTruthy();
    expect(getByText('mention/Here Description')).toBeTruthy();
  });

  it('renders a role row with the role name and the notify subtitle', () => {
    const { getByText } = wrap(<MentionSuggestionItem {...roleEntity} />);
    expect(getByText('@admin')).toBeTruthy();
    // The test translation context echoes the i18n key; the {{ role }}
    // interpolation is left as-is, which is enough to assert the right key
    // was selected with the right argument.
    expect(getByText(/Notify all .* members/)).toBeTruthy();
  });

  it('renders a user group row with name + description', () => {
    const { getByText } = wrap(<MentionSuggestionItem {...groupEntity} />);
    expect(getByText('@engineering')).toBeTruthy();
    expect(getByText('Engineering org')).toBeTruthy();
  });

  it('omits the subtitle slot when a user group has no description', () => {
    const { queryByText } = wrap(
      <MentionSuggestionItem
        {...({ ...groupEntity, description: undefined } as UserGroupMentionSuggestion)}
      />,
    );
    expect(queryByText('Engineering org')).toBeNull();
  });

  it('renders nothing for an unknown mention type', () => {
    const { toJSON } = wrap(
      <MentionSuggestionItem
        {...({ id: 'x', mentionType: 'unknown' } as unknown as ChannelMentionSuggestion)}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
