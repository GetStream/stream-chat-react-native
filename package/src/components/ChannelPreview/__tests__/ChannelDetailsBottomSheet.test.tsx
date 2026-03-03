import React from 'react';
import { Text } from 'react-native';

import { render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ThemeProvider, defaultTheme } from '../../../contexts';
import type { ChannelActionItem } from '../../ChannelList/hooks/useChannelActionItems';
import type { ChannelDetailsHeaderProps } from '../ChannelDetailsBottomSheet';
import { ChannelDetailsBottomSheet } from '../ChannelDetailsBottomSheet';

const mockStreamBottomSheetModalFlatList = jest.fn(() => null);

jest.mock('../../UIComponents', () => ({
  StreamBottomSheetModalFlatList: (...args: unknown[]) =>
    mockStreamBottomSheetModalFlatList(...args),
}));

describe('ChannelDetailsBottomSheet', () => {
  const channel = { cid: 'messaging:test-channel', id: 'test-channel' } as Channel;

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
        <ChannelDetailsBottomSheet
          channel={channel}
          items={items}
          ChannelDetailsHeader={CustomChannelDetailsHeader}
        />
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
        <ChannelDetailsBottomSheet
          channel={channel}
          items={items}
          ChannelDetailsHeader={() => null}
          additionalFlatListProps={{ onEndReached, testID: 'channel-details-list' }}
        />
      </ThemeProvider>,
    );

    expect(mockStreamBottomSheetModalFlatList).toHaveBeenCalled();
    const flatListProps = mockStreamBottomSheetModalFlatList.mock.calls[0]?.[0];
    expect(flatListProps).toEqual(
      expect.objectContaining({
        onEndReached,
        testID: 'channel-details-list',
      }),
    );
  });
});
