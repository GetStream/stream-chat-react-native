import React from 'react';

import { render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import * as useChannelImageModule from '../../../../hooks/useChannelImage';
import * as useChannelNameModule from '../../../../hooks/useChannelName';
import * as useChannelMembersStateModule from '../../../ChannelList/hooks/useChannelMembersState';
import * as useChannelPreviewDisplayPresenceModule from '../../../ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { ChannelAvatar } from '../ChannelAvatar';

const avatarCalls: Array<{ imageUrl?: string }> = [];
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
    UserAvatarGroup: () => ReactActual.createElement(RN.View, { testID: 'user-avatar-group' }),
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

const buildChannel = (): Channel =>
  ({
    cid: 'messaging:test',
    data: {},
    on: () => ({ unsubscribe: () => undefined }),
  }) as unknown as Channel;

const buildMembers = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { user: { id } }]));

const renderAvatar = (props: Partial<React.ComponentProps<typeof ChannelAvatar>> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ChatProvider value={{ client: { user: { id: OWN_USER_ID } } } as never}>
        <ChannelAvatar channel={buildChannel()} {...props} />
      </ChatProvider>
    </ThemeProvider>,
  );

describe('ChannelAvatar', () => {
  beforeEach(() => {
    avatarCalls.length = 0;
    jest
      .spyOn(useChannelPreviewDisplayPresenceModule, 'useChannelPreviewDisplayPresence')
      .mockReturnValue(false);
    jest.spyOn(useChannelNameModule, 'useChannelName').mockReturnValue('Channel Name');
    jest.spyOn(useChannelImageModule, 'useChannelImage').mockReturnValue(undefined);
    jest.spyOn(useChannelMembersStateModule, 'useChannelMembersState').mockReturnValue({});
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
      jest
        .spyOn(useChannelMembersStateModule, 'useChannelMembersState')
        .mockReturnValue(buildMembers(OWN_USER_ID, 'a', 'b') as never);

      renderAvatar();

      expect(screen.getByTestId('user-avatar-group')).toBeTruthy();
      expect(screen.queryByTestId('avatar')).toBeNull();
    });

    it('falls back to a single user avatar when there is no image and at most one other member', () => {
      jest
        .spyOn(useChannelMembersStateModule, 'useChannelMembersState')
        .mockReturnValue(buildMembers(OWN_USER_ID, 'a') as never);

      renderAvatar();

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
      jest
        .spyOn(useChannelMembersStateModule, 'useChannelMembersState')
        .mockReturnValue(buildMembers(OWN_USER_ID, 'a', 'b') as never);

      renderAvatar({ isPreview: true, previewUri: null });

      expect(screen.getByTestId('user-avatar-group')).toBeTruthy();
      expect(screen.queryByTestId('avatar')).toBeNull();
    });
  });
});
