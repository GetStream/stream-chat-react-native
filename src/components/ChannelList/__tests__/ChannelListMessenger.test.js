import React from 'react';
import { Text, View } from 'react-native';
import { cleanup } from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import { ThemeProvider } from '@stream-io/styled-components';

import ChannelListMessenger from '../ChannelListMessenger';

import { TranslationContext } from '../../../context';
import { defaultTheme } from '../../../styles/theme';

const channels = [
  { cid: '1', name: 'dan', on: () => null },
  { cid: '2', name: 'neil', on: () => null },
];

const t = jest.fn((key) => key);

const Component = ({ error = false, loadingChannels = false }) => (
  <ThemeProvider theme={defaultTheme}>
    <TranslationContext.Provider value={{ t }}>
      <ChannelListMessenger
        channels={channels}
        error={error}
        loadingChannels={loadingChannels}
        LoadingErrorIndicator={() => (
          <View>
            <Text>Loading Error Indicator</Text>
          </View>
        )}
        LoadingIndicator={() => (
          <View>
            <Text>Loading Indicator</Text>
          </View>
        )}
      />
    </TranslationContext.Provider>
  </ThemeProvider>
);

describe('ChannelListMessenger', () => {
  afterEach(cleanup);

  it('renders correctly', () => {
    const tree = renderer.create(<Component />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders the `LoadingErrorIndicator` when `error` prop is true', () => {
    const tree = renderer.create(<Component error={true} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders the `LoadingIndicator` when `loadingChannels` prop is true', () => {
    const tree = renderer.create(<Component loadingChannels={true} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
