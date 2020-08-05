import React from 'react';
import { Text, View } from 'react-native';
import { cleanup } from '@testing-library/react-native';
import renderer from 'react-test-renderer';

import ChannelListMessenger from '../ChannelListMessenger';

const channels = [
  { id: '1', name: 'dan' },
  { id: '2', name: 'neil' },
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

const Component = ({
  error = false,
  loadingChannels = false,
  refreshing = false,
}) => (
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
