import React from 'react';
import { Text, View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@stream-io/styled-components';

import ChannelListMessenger from '../ChannelListMessenger';
import { Chat } from '../../Chat';
import { TranslationContext } from '../../../context';
import { getTestClient } from '../../../mock-builders';
import { defaultTheme } from '../../../styles/theme';

const mockChannels = [
  { cid: '1', name: 'dan', on: () => null, off: () => null },
  { cid: '2', name: 'neil', on: () => null, off: () => null },
];

const t = jest.fn((key) => key);

const Component = ({
  channels = mockChannels,
  error = false,
  loadingChannels = false,
}) => (
  <ThemeProvider theme={defaultTheme}>
    <TranslationContext.Provider value={{ t }}>
      <Chat client={getTestClient()}>
        <ChannelListMessenger
          channels={channels}
          error={error}
          loadingChannels={loadingChannels}
          LoadingIndicator={() => (
            <View testID='loading-indicator'>
              <Text>Loading Indicator</Text>
            </View>
          )}
        />
      </Chat>
    </TranslationContext.Provider>
  </ThemeProvider>
);

describe('ChannelListMessenger', () => {
  afterEach(cleanup);

  it('renders without crashing', async () => {
    const { getByTestId, toJSON } = render(<Component />);
    await waitFor(() => {
      expect(getByTestId('channel-list-messenger')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('renders the `EmptyStateIndicator` when no channels are present', async () => {
    const { getByTestId, toJSON } = render(<Component channels={[]} />);
    await waitFor(() => {
      expect(getByTestId('empty-channel-state')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('renders the `LoadingErrorIndicator` when `error` prop is true', async () => {
    const { getByTestId, toJSON } = render(<Component error={true} />);
    await waitFor(() => {
      expect(getByTestId('channel-loading-error')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('renders the `LoadingIndicator` when `loadingChannels` prop is true', async () => {
    const { getByTestId, toJSON } = render(
      <Component loadingChannels={true} />,
    );
    await waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
