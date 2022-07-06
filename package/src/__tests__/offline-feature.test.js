/* eslint-disable no-underscore-dangle */
import React from 'react';
import { Text, View } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { BetterSqlite } from './utils/BetterSqlite';

import { ChannelList } from '../components/ChannelList/ChannelList';
import { Chat } from '../components/Chat/Chat';
import { useChannelsContext } from '../contexts/channelsContext/ChannelsContext';
import { queryChannelsApi } from '../mock-builders/api/queryChannels';
import { useMockedApis } from '../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../mock-builders/generator/channel';
import { getTestClientWithUser } from '../mock-builders/mock';
import { convertFilterSortToQuery } from '../store/apis/utils/convertFilterSortToQuery';
import { tables } from '../store/schema';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug.
 */
const ChannelPreviewComponent = ({ channel, setActiveChannel }) => (
  <View accessibilityRole='list-item' onPress={setActiveChannel} testID={channel.cid}>
    <Text>{channel.data.name}</Text>
    <Text>{channel.state.messages[0]?.text}</Text>
  </View>
);

const ChannelListComponent = (props) => {
  const { channels, onSelect } = useChannelsContext();
  return (
    <View testID='channel-list'>
      {channels.map((channel) => (
        <ChannelPreviewComponent
          {...props}
          channel={channel}
          key={channel.id}
          setActiveChannel={onSelect}
        />
      ))}
    </View>
  );
};

describe('Offline support is disabled', () => {
  let chatClient;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'dan' });
    BetterSqlite.dropAllTables();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    cleanup();
  });

  it('should NOT create tables on first load if offline feature is disabled', async () => {
    const { getByTestId } = render(
      <Chat client={chatClient}>
        <View testID='test-child'></View>
      </Chat>,
    );
    await waitFor(() => expect(getByTestId('test-child')).toBeTruthy());

    const tablesInDb = BetterSqlite.getTables();
    const tableNamesInDB = tablesInDb.map((table) => table.name);
    const tablesNamesInSchema = Object.keys(tables);

    tablesNamesInSchema.forEach((name) => expect(tableNamesInDB.includes(name)).toBe(false));
  });
});

describe('Offline support is enabled', () => {
  let chatClient;
  let testChannel1;
  let testChannel2;
  let testChannel3;

  beforeEach(async () => {
    jest.clearAllMocks();
    chatClient = await getTestClientWithUser({ id: 'dan' });
    testChannel1 = generateChannelResponse();
    testChannel2 = generateChannelResponse();
    testChannel3 = generateChannelResponse();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    cleanup();
  });

  const filters = {
    foo: 'bar',
    type: 'messaging',
  };
  const sort = { last_message_at: 1 };

  const renderComponent = () =>
    render(
      <Chat client={chatClient} enableOfflineSupport>
        <ChannelList
          filters={filters}
          List={ChannelListComponent}
          Preview={ChannelPreviewComponent}
          sort={sort}
        />
      </Chat>,
    );

  it('should create tables on first load if offline feature is enabled', async () => {
    const { getByTestId } = render(
      <Chat client={chatClient} enableOfflineSupport>
        <View testID='test-child'></View>
      </Chat>,
    );
    await waitFor(() => expect(getByTestId('test-child')).toBeTruthy());

    const tablesInDb = BetterSqlite.getTables();
    const tableNamesInDB = tablesInDb.map((table) => table.name);
    const tablesNamesInSchema = Object.keys(tables);

    tablesNamesInSchema.forEach((name) => expect(tableNamesInDB.includes(name)).toBe(true));
  });

  it('should store filter-sort query and cids on ChannelList in channelQueries table', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);

    const { getByTestId, queryAllByA11yRole } = renderComponent();
    await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

    const channelQueriesRows = BetterSqlite.selectFromTable('channelQueries');

    const channelIdsOnUI = queryAllByA11yRole('list-item').map(
      (node) => node._fiber.pendingProps.testID,
    );
    const cidsInDB = JSON.parse(channelQueriesRows[0].cids);

    const filterSortQueryInDB = channelQueriesRows[0].id;
    const actualFilterSortQueryInDB = convertFilterSortToQuery({ filters, sort });

    expect(channelQueriesRows.length).toBe(1);
    expect(filterSortQueryInDB).toBe(actualFilterSortQueryInDB);

    expect(cidsInDB.length).toBe(channelIdsOnUI.length);
    channelIdsOnUI.forEach((cidOnUi, index) => {
      expect(cidsInDB.includes(cidOnUi)).toBe(true);
      expect(index).toBe(cidsInDB.indexOf(cidOnUi));
    });
  });

  it('should store channels in "channels" table', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);

    const { getByTestId, queryAllByA11yRole } = renderComponent();
    await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

    const channelIdsOnUI = queryAllByA11yRole('list-item').map(
      (node) => node._fiber.pendingProps.testID,
    );
    const channelsRows = BetterSqlite.selectFromTable('channels');

    expect(channelsRows.length).toBe(channelIdsOnUI.length);

    channelsRows.forEach((channelInDb) =>
      expect(channelIdsOnUI.includes(channelInDb.cid)).toBe(true),
    );
  });
});
