import React from 'react';
import { Text } from 'react-native';

import { render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ThemeProvider, defaultTheme } from '../../../contexts';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import type { ChannelActionItem } from '../../ChannelList/hooks/useChannelActionItems';
import type { ChannelDetailsHeaderProps } from '../ChannelDetailsBottomSheet';
import { ChannelDetailsBottomSheet } from '../ChannelDetailsBottomSheet';

const mockStreamBottomSheetModalFlatList = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_props: Record<string, unknown>) => null,
);

jest.mock('../../UIComponents/StreamBottomSheetModalFlatList', () => ({
  StreamBottomSheetModalFlatList: (...args: [Record<string, unknown>]) =>
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
      mockStreamBottomSheetModalFlatList.mock.calls[0] as unknown as [Record<string, unknown>]
    )?.[0];
    expect(flatListProps).toEqual(
      expect.objectContaining({
        onEndReached,
        testID: 'channel-details-list',
      }),
    );
  });
});
