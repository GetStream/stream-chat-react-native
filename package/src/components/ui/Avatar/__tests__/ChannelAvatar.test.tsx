import React from 'react';

import { StateStore } from '@stream-io/state-store';
import { act, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import * as useChannelImageModule from '../../../../hooks/useChannelImage';
import * as useChannelNameModule from '../../../../hooks/useChannelName';
import * as useChannelPreviewDisplayPresenceModule from '../../../ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { ChannelAvatar } from '../ChannelAvatar';

const avatarCalls: Array<{ imageUrl?: string }> = [];
let avatarGroupRenders = 0;
jest.mock('../Avatar', () => {
  const RN = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  return {
    Avatar: (props: { imageUrl?: string }) => {
      avatarCalls.push({ imageUrl: props.imageUrl });
      return ReactActual.createElement(RN.View, { testID: 'avatar' });
    },
  };
});

jest.mock('../AvatarGroup', () => {
  const RN = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  return {
    UserAvatarGroup: () => {
      avatarGroupRenders += 1;
      return ReactActual.createElement(RN.View, { testID: 'user-avatar-group' });
    },
  };
});

jest.mock('../UserAvatar', () => {
  const RN = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  return {
    UserAvatar: () => ReactActual.createElement(RN.View, { testID: 'user-avatar' }),
  };
});

const OWN_USER_ID = 'me';

const buildMembers = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { user: { id } }]));

const buildChannel = (members: Record<string, unknown> = {}): Channel =>
  ({
    cid: 'messaging:test',
    data: {},
    on: () => ({ unsubscribe: () => undefined }),
    state: new StateStore({ members }),
  }) as unknown as Channel;

const renderAvatar = (
  props: Partial<React.ComponentProps<typeof ChannelAvatar>> = {},
  channel: Channel = buildChannel(),
) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ChatProvider value={{ client: { user: { id: OWN_USER_ID } } } as never}>
        <ChannelAvatar channel={channel} {...props} />
      </ChatProvider>
    </ThemeProvider>,
  );

describe('ChannelAvatar', () => {
  beforeEach(() => {
    avatarCalls.length = 0;
    avatarGroupRenders = 0;
    jest
      .spyOn(useChannelPreviewDisplayPresenceModule, 'useChannelPreviewDisplayPresence')
      .mockReturnValue(false);
    jest.spyOn(useChannelNameModule, 'useChannelName').mockReturnValue('Channel Name');
    jest.spyOn(useChannelImageModule, 'useChannelImage').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('default (non-preview) mode', () => {
    it('renders the stored channel image when present', () => {
      jest
        .spyOn(useChannelImageModule, 'useChannelImage')
        .mockReturnValue('https://example.com/live.png');

      renderAvatar();

      expect(screen.getByTestId('avatar')).toBeTruthy();
      expect(avatarCalls[avatarCalls.length - 1].imageUrl).toBe('https://example.com/live.png');
    });

    it('falls back to the user-avatar group when there is no image and 2+ other members', () => {
      renderAvatar({}, buildChannel(buildMembers(OWN_USER_ID, 'a', 'b')));

      expect(screen.getByTestId('user-avatar-group')).toBeTruthy();
      expect(screen.queryByTestId('avatar')).toBeNull();
    });

    it('falls back to a single user avatar when there is no image and at most one other member', () => {
      renderAvatar({}, buildChannel(buildMembers(OWN_USER_ID, 'a')));

      expect(screen.getByTestId('user-avatar')).toBeTruthy();
      expect(screen.queryByTestId('avatar')).toBeNull();
    });

    it('ignores previewUri when isPreview is false', () => {
      jest
        .spyOn(useChannelImageModule, 'useChannelImage')
        .mockReturnValue('https://example.com/live.png');

      renderAvatar({ isPreview: false, previewUri: 'file://picked.png' });

      expect(avatarCalls[avatarCalls.length - 1].imageUrl).toBe('https://example.com/live.png');
    });
  });

  describe('preview mode', () => {
    it('renders the previewUri instead of the stored channel image', () => {
      jest
        .spyOn(useChannelImageModule, 'useChannelImage')
        .mockReturnValue('https://example.com/live.png');

      renderAvatar({ isPreview: true, previewUri: 'file://picked.png' });

      expect(screen.getByTestId('avatar')).toBeTruthy();
      expect(avatarCalls[avatarCalls.length - 1].imageUrl).toBe('file://picked.png');
    });

    it('falls back to the member avatars when previewUri is null (reset), ignoring the stored image', () => {
      jest
        .spyOn(useChannelImageModule, 'useChannelImage')
        .mockReturnValue('https://example.com/live.png');

      renderAvatar(
        { isPreview: true, previewUri: null },
        buildChannel(buildMembers(OWN_USER_ID, 'a', 'b')),
      );

      expect(screen.getByTestId('user-avatar-group')).toBeTruthy();
      expect(screen.queryByTestId('avatar')).toBeNull();
    });
  });

  describe('member updates', () => {
    const groupMembers = (online: boolean, name = 'A') => ({
      [OWN_USER_ID]: { user: { id: OWN_USER_ID } },
      a: { user: { id: 'a', name, online } },
      b: { user: { id: 'b' } },
    });

    it('does not re-render the group when only a presence changes', () => {
      const channel = buildChannel(groupMembers(false));
      renderAvatar({}, channel);
      const renders = avatarGroupRenders;

      act(() => {
        (channel.state as unknown as StateStore<Record<string, unknown>>).next({
          members: groupMembers(true),
        });
      });

      expect(avatarGroupRenders).toBe(renders);
    });

    it('re-renders the group when a shown member is renamed', () => {
      const channel = buildChannel(groupMembers(false));
      renderAvatar({}, channel);
      const renders = avatarGroupRenders;

      act(() => {
        (channel.state as unknown as StateStore<Record<string, unknown>>).next({
          members: groupMembers(false, 'Renamed'),
        });
      });

      expect(avatarGroupRenders).toBe(renders + 1);
    });
  });
});
