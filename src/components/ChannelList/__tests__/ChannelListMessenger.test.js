import React from 'react';
import { Text, View } from 'react-native';
import { cleanup } from '@testing-library/react-native';
import renderer from 'react-test-renderer';

import ChannelListMessenger from '../ChannelListMessenger';
import { TranslationContext } from '../../../context';
import { ThemeProvider } from '@stream-io/styled-components';
import { defaultTheme } from '../../../styles/theme';
import { Chat } from '../../Chat';
import { getTestClient } from '../../../mock-builders';

const channels = [
  { cid: '1', name: 'dan', on: () => null },
  { cid: '2', name: 'neil', on: () => null },
];

const ComponentTest = () => (
  <>
    <View>
      <Text>{channels[0].name}</Text>
    </View>
    <View>
      <Text>{channels[1].name}</Text>
    </View>
  </>
);

const t = jest.fn((key) => key);

const client = getTestClient();

const Component = ({
  error = false,
  loadingChannels = false,
  refreshing = false,
}) => (
  <Chat client={client}>
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
          refreshing={refreshing}
        />
      </TranslationContext.Provider>
    </ThemeProvider>
  </Chat>
);

describe('ChannelListMessenger', () => {
  afterEach(cleanup);

  it('passes', () => {
    expect(true).toBeTruthy();
  });

  it('renders a test component correctly', () => {
    const tree = renderer.create(<ComponentTest />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly', () => {
    const tree = renderer.create(<Component />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', () => {
  //   const tree = renderer.create(<Component error={true} />).toJSON();
  //   expect(tree).toMatchSnapshot();
  // });

  // it('when `loading` prop is true, `LoadingIndicator` should be rendered', () => {
  //   const tree = renderer.create(<Component loading={true} />).toJSON();
  //   expect(tree).toMatchSnapshot();
  // });
});
