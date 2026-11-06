import React, { type ComponentProps } from 'react';
import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ThemeProvider, defaultTheme } from '../../../contexts';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import type { ChannelActionItem } from '../../../hooks/actions/useChannelActionItems';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import { Chat } from '../../Chat/Chat';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';
import type { ChannelDetailsHeaderProps } from '../ChannelDetailsBottomSheet';
import { ChannelDetailsBottomSheet, ChannelDetailsHeader } from '../ChannelDetailsBottomSheet';

type StreamBottomSheetModalFlatListProps = ComponentProps<typeof StreamBottomSheetModalFlatList>;

const mockStreamBottomSheetModalFlatList = jest.fn(
  (_props: StreamBottomSheetModalFlatListProps) => null,
);

jest.mock('../../UIComponents/StreamBottomSheetModalFlatList', () => ({
  StreamBottomSheetModalFlatList: (...args: [StreamBottomSheetModalFlatListProps]) =>
    mockStreamBottomSheetModalFlatList(...args),
}));

describe('ChannelDetailsBottomSheet', () => {
  const channel = {
    cid: 'messaging:test-channel',
    id: 'test-channel',
    state: { members: {} },
  } as unknown as Channel;

  const items: ChannelActionItem[] = [
    {
      Icon: () => null,
      action: jest.fn(),
      id: 'mute',
      label: 'Mute',
      placement: 'both',
      type: 'standard',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders custom ChannelDetailsHeader override', () => {
    const CustomChannelDetailsHeader = ({ channel: headerChannel }: ChannelDetailsHeaderProps) => (
      <Text testID='custom-channel-details-header'>{headerChannel.cid}</Text>
    );

    const { getByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <WithComponents overrides={{ ChannelDetailsHeader: CustomChannelDetailsHeader }}>
          <ChannelDetailsBottomSheet channel={channel} items={items} />
        </WithComponents>
      </ThemeProvider>,
    );

    expect(getByTestId('custom-channel-details-header')).toHaveTextContent(
      'messaging:test-channel',
    );
  });

  it('forwards additionalFlatListProps to StreamBottomSheetModalFlatList', () => {
    const onEndReached = jest.fn();

    render(
      <ThemeProvider theme={defaultTheme}>
        <WithComponents overrides={{ ChannelDetailsHeader: () => null }}>
          <ChannelDetailsBottomSheet
            channel={channel}
            items={items}
            additionalFlatListProps={{ onEndReached, testID: 'channel-details-list' }}
          />
        </WithComponents>
      </ThemeProvider>,
    );

    expect(mockStreamBottomSheetModalFlatList).toHaveBeenCalled();
    const flatListProps = (
      mockStreamBottomSheetModalFlatList.mock.calls[0] as unknown as [
        StreamBottomSheetModalFlatListProps,
      ]
    )?.[0];
    expect(flatListProps).toEqual(
      expect.objectContaining({
        onEndReached,
        testID: 'channel-details-list',
      }),
    );
  });
});

describe('ChannelDetailsHeader', () => {
  const me = generateUser({ id: 'me' });

  const renderDirectChat = async (otherOnline: boolean, watcherCount: number) => {
    const other = generateUser({ id: 'other', online: otherOnline });
    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({
      channelsData: [{ members: [generateMember({ user: me }), generateMember({ user: other })] }],
      customUser: me,
    });
    channel.state.watcher_count = watcherCount;
    render(
      <Chat client={client}>
        <ChannelDetailsHeader channel={channel} />
      </Chat>,
    );
  };

  it('shows a direct chat as offline while only the current user watches it', async () => {
    await renderDirectChat(false, 1);
    expect(await screen.findByText('Offline')).toBeTruthy();
  });

  it('shows a direct chat as online when the other member is online', async () => {
    await renderDirectChat(true, 2);
    expect(await screen.findByText('Online')).toBeTruthy();
  });
});
