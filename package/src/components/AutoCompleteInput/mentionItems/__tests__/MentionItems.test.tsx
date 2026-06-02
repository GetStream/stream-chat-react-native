import React from 'react';

import { cleanup, render } from '@testing-library/react-native';

// UserAvatar pulls in the ComponentsContext defaults which transitively load
// stream-chat-js's CJS dist; that fails to resolve @babel/runtime when the SDK
// is consumed from a workspace symlink during tests. The avatar itself isn't
// what we're asserting on here, so substitute a no-op.
jest.mock('../../../ui/Avatar/UserAvatar', () => ({
  UserAvatar: () => null,
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
import { MentionBroadcastItem } from '../MentionBroadcastItem';
import { MentionRoleItem } from '../MentionRoleItem';
import { MentionUserGroupItem } from '../MentionUserGroupItem';
import { MentionUserItem } from '../MentionUserItem';

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

describe('mention row components', () => {
  afterEach(() => {
    cleanup();
  });

  it('MentionUserItem renders the display name', () => {
    const { getByText } = wrap(<MentionUserItem entity={userEntity} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('MentionBroadcastItem renders @channel for a channel entity', () => {
    const { getByText } = wrap(<MentionBroadcastItem entity={channelEntity} />);
    expect(getByText('@channel')).toBeTruthy();
  });

  it('MentionBroadcastItem renders @here for a here entity', () => {
    const { getByText } = wrap(<MentionBroadcastItem entity={hereEntity} />);
    expect(getByText('@here')).toBeTruthy();
  });

  it('MentionRoleItem renders the role name prefixed by @', () => {
    const { getByText } = wrap(<MentionRoleItem entity={roleEntity} />);
    expect(getByText('@admin')).toBeTruthy();
  });

  it('MentionUserGroupItem renders name, description, and member count', () => {
    const { getByText } = wrap(<MentionUserGroupItem entity={groupEntity} />);
    expect(getByText('@engineering')).toBeTruthy();
    expect(getByText('Engineering org')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
  });

  it('MentionUserGroupItem omits the member count slot when missing', () => {
    const { queryByText } = wrap(
      <MentionUserGroupItem
        entity={{ ...groupEntity, memberCount: undefined } as UserGroupMentionSuggestion}
      />,
    );
    expect(queryByText('42')).toBeNull();
  });
});
