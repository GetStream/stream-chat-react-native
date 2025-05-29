/* eslint-disable no-underscore-dangle */

import React from 'react';
import { Text, View } from 'react-native';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { v4 as uuidv4 } from 'uuid';

import { ChannelList } from '../../components/ChannelList/ChannelList';
import { Chat } from '../../components/Chat/Chat';
import { useChannelsContext } from '../../contexts/channelsContext/ChannelsContext';
import { getOrCreateChannelApi } from '../../mock-builders/api/getOrCreateChannel';
import { queryChannelsApi } from '../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../mock-builders/api/useMockedApis';
import dispatchChannelDeletedEvent from '../../mock-builders/event/channelDeleted';
import dispatchChannelHiddenEvent from '../../mock-builders/event/channelHidden';
import dispatchChannelTruncatedEvent from '../../mock-builders/event/channelTruncated';
import dispatchChannelUpdatedEvent from '../../mock-builders/event/channelUpdated';
import dispatchChannelVisibleEvent from '../../mock-builders/event/channelVisible';
import dispatchConnectionChangedEvent from '../../mock-builders/event/connectionChanged';
import dispatchMemberAddedEvent from '../../mock-builders/event/memberAdded';
import dispatchMemberRemovedEvent from '../../mock-builders/event/memberRemoved';
import dispatchMemberUpdatedEvent from '../../mock-builders/event/memberUpdated';
import dispatchMessageNewEvent from '../../mock-builders/event/messageNew';
import dispatchMessageReadEvent from '../../mock-builders/event/messageRead';
import dispatchMessageUpdatedEvent from '../../mock-builders/event/messageUpdated';
import dispatchNotificationAddedToChannel from '../../mock-builders/event/notificationAddedToChannel';
import dispatchNotificationMarkUnread from '../../mock-builders/event/notificationMarkUnread';
import dispatchNotificationMessageNewEvent from '../../mock-builders/event/notificationMessageNew';
import dispatchNotificationRemovedFromChannel from '../../mock-builders/event/notificationRemovedFromChannel';
import dispatchReactionDeletedEvent from '../../mock-builders/event/reactionDeleted';
import dispatchReactionNewEvent from '../../mock-builders/event/reactionNew';
import dispatchReactionUpdatedEvent from '../../mock-builders/event/reactionUpdated';
import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMember } from '../../mock-builders/generator/member';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateReaction } from '../../mock-builders/generator/reaction';
import { generateUser } from '../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../mock-builders/mock';
import { convertFilterSortToQuery } from '../../store/apis/utils/convertFilterSortToQuery';
import { tables } from '../../store/schema';
import { BetterSqlite } from '../../test-utils/BetterSqlite';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug.
 */
const ChannelPreviewComponent = ({ channel, setActiveChannel }) => (
  <View accessibilityLabel='list-item' onPress={setActiveChannel} testID={channel.cid}>
    <Text>{channel.data.name}</Text>
    <Text>{channel.state.messages[0]?.text}</Text>
  </View>
);

const ChannelListComponent = (props) => {
  const { channels, onSelect } = useChannelsContext();
  if (!channels) {
    return null;
  }

  return (
    <View testID='channel-list'>
      {channels?.map((channel) => (
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

test('Workaround to allow exporting tests', () => expect(true).toBe(true));

export const Generic = () => {
  describe('Offline support is disabled', () => {
    let chatClient;

    beforeAll(async () => {
      jest.clearAllMocks();
      chatClient = await getTestClientWithUser({ id: 'dan' });
      await BetterSqlite.openDB();
      BetterSqlite.dropAllTables();
    });

    afterAll(() => {
      BetterSqlite.dropAllTables();
      BetterSqlite.closeDB();
      cleanup();
      jest.clearAllMocks();
    });

    it('should NOT create tables on first load if offline feature is disabled', async () => {
      render(
        <Chat client={chatClient}>
          <View testID='test-child' />
        </Chat>,
      );
      await waitFor(() => expect(screen.getByTestId('test-child')).toBeTruthy());

      await waitFor(async () => {
        const tablesInDb = await BetterSqlite.getTables();
        const tableNamesInDB = tablesInDb.map((table) => table.name);
        const tablesNamesInSchema = Object.keys(tables);

        tablesNamesInSchema.forEach((name) => {
          expect(tableNamesInDB.includes(name)).toBe(false);
        });
      });
    });
  });

  describe('Offline support is enabled', () => {
    let chatClient;
    let channels;

    let allUsers;
    let allMessages;
    let allMembers;
    let allReactions;
    let allReads;
    const getRandomInt = (lower, upper) => Math.floor(lower + Math.random() * (upper - lower + 1));
    const createChannel = (messagesOverride) => {
      const id = uuidv4();
      const cid = `messaging:${id}`;
      // always guarantee at least 2 members for ease of use; cases that need to test specific behaviour
      // for 1 or 0 member channels should explicitly generate them.
      const begin = getRandomInt(0, allUsers.length - 3); // begin shouldn't be the end of users.length
      const end = getRandomInt(begin + 2, allUsers.length - 1);
      const usersForMembers = allUsers.slice(begin, end);
      const members = usersForMembers.map((user) =>
        generateMember({
          cid,
          user,
        }),
      );
      members.push(generateMember({ cid, user: chatClient.user }));

      const messages =
        messagesOverride ||
        Array(10)
          .fill(1)
          .map(() => {
            const id = uuidv4();
            const user = usersForMembers[getRandomInt(0, usersForMembers.length - 1)];

            const begin = getRandomInt(0, usersForMembers.length - 2); // begin shouldn't be the end of users.length
            const end = getRandomInt(begin + 1, usersForMembers.length - 1);

            const usersForReactions = usersForMembers.slice(begin, end);
            const reactions = usersForReactions.map((user) =>
              generateReaction({
                message_id: id,
                user,
              }),
            );
            allReactions.push(...reactions);
            return generateMessage({
              cid,
              id,
              latest_reactions: reactions,
              user,
              userId: user.id,
            });
          });

      const reads = members.map((member) => ({
        cid,
        last_read: new Date(new Date().setDate(new Date().getDate() - getRandomInt(0, 20))),
        unread_messages: 0,
        user: member.user,
      }));

      allMessages.push(...messages);
      allMembers.push(...members);
      allReads.push(...reads);

      return generateChannelResponse({
        cid,
        id,
        members,
        messages,
        read: reads,
      });
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      chatClient = await getTestClientWithUser({ id: 'dan' });
      allUsers = Array(20).fill(1).map(generateUser);
      allUsers.push(chatClient.user);
      allMessages = [];
      allMembers = [];
      allReactions = [];
      allReads = [];

      channels = Array(10)
        .fill(1)
        .map(() => createChannel());
      await BetterSqlite.openDB();
      BetterSqlite.dropAllTables();
    });

    afterEach(() => {
      BetterSqlite.dropAllTables();
      BetterSqlite.closeDB();

      cleanup();
      jest.clearAllMocks();
    });

    const filters = {
      foo: 'bar',
      type: 'messaging',
    };
    const sort = { last_updated: 1 };

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

    const expectCIDsOnUIToBeInDB = async (queryAllByLabelText) => {
      const channelIdsOnUI = queryAllByLabelText('list-item').map(
        (node) => node._fiber.pendingProps.testID,
      );

      await waitFor(async () => {
        const channelQueriesRows = await BetterSqlite.selectFromTable('channelQueries');
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
    };

    const expectAllChannelsWithStateToBeInDB = async (queryAllByLabelText) => {
      const channelIdsOnUI = queryAllByLabelText('list-item').map(
        (node) => node._fiber.pendingProps.testID,
      );

      await waitFor(async () => {
        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const membersRows = await BetterSqlite.selectFromTable('members');
        const usersRows = await BetterSqlite.selectFromTable('users');
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const readsRows = await BetterSqlite.selectFromTable('reads');

        expect(channelIdsOnUI.length).toBe(channels.length);
        expect(channelsRows.length).toBe(channels.length);
        expect(messagesRows.length).toBe(allMessages.length);
        expect(membersRows.length).toBe(allMembers.length);
        expect(reactionsRows.length).toBe(allReactions.length);

        channelsRows.forEach((row) => {
          expect(channelIdsOnUI.includes(row.cid)).toBe(true);
        });

        messagesRows.forEach((row) => {
          expect(allMessages.filter((m) => m.id === row.id)).toHaveLength(1);
        });
        membersRows.forEach((row) =>
          expect(
            allMembers.filter((m) => m.cid === row.cid && m.user.id === row.userId),
          ).toHaveLength(1),
        );
        usersRows.forEach((row) => expect(allUsers.filter((u) => u.id === row.id)).toHaveLength(1));
        reactionsRows.forEach((row) =>
          expect(
            allReactions.filter((r) => r.message_id === row.messageId && row.userId === r.user_id),
          ).toHaveLength(1),
        );
        readsRows.forEach((row) =>
          expect(
            allReads.filter((r) => r.user.id === row.userId && r.cid === row.cid),
          ).toHaveLength(1),
        );
      });
    };

    it('should create tables on first load if offline feature is enabled', async () => {
      render(
        <Chat client={chatClient} enableOfflineSupport>
          <View testID='test-child' />
        </Chat>,
      );

      await waitFor(() => expect(screen.getByTestId('test-child')).toBeTruthy());

      const tablesInDb = await BetterSqlite.getTables();
      const tableNamesInDB = tablesInDb.map((table) => table.name);
      const tablesNamesInSchema = Object.keys(tables);

      tablesNamesInSchema.forEach((name) => expect(tableNamesInDB.includes(name)).toBe(true));
    });

    it('should store filter-sort query and cids on ChannelList in channelQueries table', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();

      await act(() => dispatchConnectionChangedEvent(chatClient, false));
      // await waiter();
      await act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));

      await waitFor(async () => {
        expect(screen.getByTestId('channel-list')).toBeTruthy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);
      });
    });

    it('should store channels and its state in tables', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();

      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));

      await waitFor(async () => {
        expect(screen.getByTestId('channel-list')).toBeTruthy();
        await expectAllChannelsWithStateToBeInDB(screen.queryAllByLabelText);
      });
    });

    it('should fetch channels from the db correctly even if they are empty', async () => {
      const emptyChannel = createChannel([]);
      useMockedApis(chatClient, [queryChannelsApi([emptyChannel])]);
      jest.spyOn(chatClient, 'hydrateActiveChannels');

      renderComponent();

      await waitFor(async () => {
        act(() => dispatchConnectionChangedEvent(chatClient));
        await act(
          async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true),
        );
        expect(screen.getByTestId('channel-list')).toBeTruthy();
        expect(screen.getByTestId(emptyChannel.cid)).toBeTruthy();
        expect(chatClient.hydrateActiveChannels).toHaveBeenCalled();
        expect(chatClient.hydrateActiveChannels.mock.calls[0][0]).toStrictEqual([emptyChannel]);
      });
    });

    it('should add a new message to database', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[0].channel;
      const newMessage = generateMessage({
        cid: targetChannel.cid,
        user: generateUser(),
      });
      act(() => dispatchMessageNewEvent(chatClient, newMessage, targetChannel));

      await waitFor(async () => {
        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const readRows = await BetterSqlite.selectFromTable('reads');
        const matchingMessageRows = messagesRows.filter((m) => m.id === newMessage.id);
        const matchingReadRows = readRows.filter(
          (r) => targetChannel.cid === r.cid && chatClient.userID === r.userId,
        );

        expect(matchingMessageRows.length).toBe(1);
        expect(matchingMessageRows[0].id).toBe(newMessage.id);
        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(1);
      });
    });

    it('should correctly handle multiple new messages and add them to the database', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[0].channel;

      // check if the reads state is correct first
      await waitFor(async () => {
        const readRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readRows.filter(
          (r) => targetChannel.cid === r.cid && chatClient.userID === r.userId,
        );

        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(0);
      });

      const newMessages = [
        generateMessage({
          cid: targetChannel.cid,
          user: generateUser(),
        }),
        generateMessage({
          cid: targetChannel.cid,
          user: generateUser(),
        }),
        generateMessage({
          cid: targetChannel.cid,
          user: generateUser(),
        }),
      ];

      newMessages.forEach((newMessage) => {
        act(() => dispatchMessageNewEvent(chatClient, newMessage, targetChannel));
      });

      await waitFor(async () => {
        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const readRows = await BetterSqlite.selectFromTable('reads');
        const matchingMessageRows = messagesRows.filter((m) =>
          newMessages.some((newMessage) => newMessage.id === m.id),
        );
        const matchingReadRows = readRows.filter(
          (r) => targetChannel.cid === r.cid && chatClient.userID === r.userId,
        );

        expect(matchingMessageRows.length).toBe(3);
        newMessages.forEach((newMessage) => {
          expect(
            matchingMessageRows.some(
              (matchingMessageRow) => matchingMessageRow.id === newMessage.id,
            ),
          ).toBe(true);
        });
        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(3);
      });
    });

    it('should correctly handle multiple new messages from our own user', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[0].channel;

      // check if the reads state is correct first
      await waitFor(async () => {
        const readRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readRows.filter(
          (r) => targetChannel.cid === r.cid && chatClient.userID === r.userId,
        );

        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(0);
      });

      const newMessages = [
        generateMessage({
          cid: targetChannel.cid,
          user: chatClient.user,
        }),
        generateMessage({
          cid: targetChannel.cid,
          user: chatClient.user,
        }),
        generateMessage({
          cid: targetChannel.cid,
          user: chatClient.user,
        }),
      ];

      newMessages.forEach((newMessage) => {
        act(() => dispatchMessageNewEvent(chatClient, newMessage, targetChannel));
      });

      await waitFor(async () => {
        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const readRows = await BetterSqlite.selectFromTable('reads');
        const matchingMessageRows = messagesRows.filter((m) =>
          newMessages.some((newMessage) => newMessage.id === m.id),
        );
        const matchingReadRows = readRows.filter(
          (r) => targetChannel.cid === r.cid && chatClient.userID === r.userId,
        );

        expect(matchingMessageRows.length).toBe(3);
        newMessages.forEach((newMessage) => {
          expect(
            matchingMessageRows.some(
              (matchingMessageRow) => matchingMessageRow.id === newMessage.id,
            ),
          ).toBe(true);
        });
        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(0);
      });
    });

    it('should add a new channel and a new message to database from notification event', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => {
        expect(screen.getByTestId('channel-list')).toBeTruthy();
      });

      const newChannel = createChannel();
      channels.push(newChannel);
      useMockedApis(chatClient, [getOrCreateChannelApi(newChannel)]);

      await act(() => dispatchNotificationMessageNewEvent(chatClient, newChannel.channel));
      await waitFor(() => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(newChannel.channel.cid)).toBeTruthy();
      });
      await expectAllChannelsWithStateToBeInDB(screen.queryAllByLabelText);
    });

    it('should update a message in database', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const updatedMessage = { ...channels[0].messages[0] };
      updatedMessage.text = uuidv4();

      act(() => dispatchMessageUpdatedEvent(chatClient, updatedMessage, channels[0].channel));

      await waitFor(async () => {
        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingRows = messagesRows.filter((m) => m.id === updatedMessage.id);

        expect(matchingRows.length).toBe(1);
        expect(matchingRows[0].text).toBe(updatedMessage.text);
      });
    });

    it('should remove the channel from DB when user is removed as member', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const removedChannel = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchNotificationRemovedFromChannel(chatClient, removedChannel));
      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(removedChannel.cid)).toBeFalsy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingRows = channelsRows.filter((c) => c.id === removedChannel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === removedChannel.cid);

        expect(matchingRows.length).toBe(0);
        expect(matchingMessagesRows.length).toBe(0);
      });
    });

    it('should remove the channel from DB if the channel is deleted', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const removedChannel = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchChannelDeletedEvent(chatClient, removedChannel));
      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(removedChannel.cid)).toBeFalsy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingRows = channelsRows.filter((c) => c.id === removedChannel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === removedChannel.cid);

        expect(matchingRows.length).toBe(0);
        expect(matchingMessagesRows.length).toBe(0);
      });
    });

    it('should correctly mark the channel as hidden in the db', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const hiddenChannel = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchChannelHiddenEvent(chatClient, hiddenChannel));
      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(hiddenChannel.cid)).toBeFalsy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingRows = channelsRows.filter((c) => c.id === hiddenChannel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === hiddenChannel.cid);

        expect(matchingRows.length).toBe(1);
        expect(matchingRows[0].hidden).toBeTruthy();
        expect(matchingMessagesRows.length).toBe(
          chatClient.activeChannels[hiddenChannel.cid].state.messages.length,
        );
      });
    });

    it('should correctly mark the channel as visible if it was hidden before in the db', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const hiddenChannel = channels[getRandomInt(0, channels.length - 1)].channel;
      // first, we mark it as hidden
      act(() => dispatchChannelHiddenEvent(chatClient, hiddenChannel));
      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(hiddenChannel.cid)).toBeFalsy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingRows = channelsRows.filter((c) => c.id === hiddenChannel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === hiddenChannel.cid);

        expect(matchingRows.length).toBe(1);
        expect(matchingRows[0].hidden).toBeTruthy();
        expect(matchingMessagesRows.length).toBe(
          chatClient.activeChannels[hiddenChannel.cid].state.messages.length,
        );
      });

      // then, we make it visible after waiting for everything to finish
      act(() => dispatchChannelVisibleEvent(chatClient, hiddenChannel));
      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(hiddenChannel.cid)).toBeFalsy();
        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingRows = channelsRows.filter((c) => c.id === hiddenChannel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === hiddenChannel.cid);

        expect(matchingRows.length).toBe(1);
        expect(matchingRows[0].hidden).toBeFalsy();
        expect(matchingMessagesRows.length).toBe(
          chatClient.activeChannels[hiddenChannel.cid].state.messages.length,
        );
      });
    });

    it('should add the channel to DB when user is added as member', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const newChannel = createChannel();
      useMockedApis(chatClient, [getOrCreateChannelApi(newChannel)]);

      act(() => dispatchNotificationAddedToChannel(chatClient, newChannel.channel));

      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(newChannel.channel.cid)).toBeTruthy();

        await expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);
        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingChannelsRows = channelsRows.filter((c) => c.id === newChannel.channel.id);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === newChannel.channel.cid);

        expect(matchingChannelsRows.length).toBe(1);
        expect(matchingMessagesRows.length).toBe(newChannel.messages.length);
      });
    });

    it('should remove the channel messages from DB when channel is truncated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const channelToTruncate = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchChannelTruncatedEvent(chatClient, channelToTruncate));

      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(channelToTruncate.cid)).toBeTruthy();
        expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === channelToTruncate.cid);

        const readsRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readsRows.filter(
          (r) => r.userId === chatClient.userID && r.cid === channelToTruncate.cid,
        );

        expect(matchingMessagesRows.length).toBe(0);
        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(0);
      });
    });

    it('should truncate the correct messages if channel.truncated arrives with truncated_at', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const channelResponse = channels[getRandomInt(0, channels.length - 1)];
      const channelToTruncate = channelResponse.channel;
      const messages = channelResponse.messages;
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      // truncate at the middle
      const truncatedAt = messages[Number(messages.length / 2)].created_at;
      act(() =>
        dispatchChannelTruncatedEvent(chatClient, {
          ...channelToTruncate,
          truncated_at: truncatedAt,
        }),
      );

      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(channelToTruncate.cid)).toBeTruthy();
        expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === channelToTruncate.cid);

        const readsRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readsRows.filter(
          (r) => r.userId === chatClient.userID && r.cid === channelToTruncate.cid,
        );

        const messagesLeft = messages.length / 2 - 1;

        expect(matchingMessagesRows.length).toBe(messagesLeft);
        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(messagesLeft);
      });
    });

    it('should gracefully handle a truncated_at date before each message', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const channelResponse = channels[getRandomInt(0, channels.length - 1)];
      const channelToTruncate = channelResponse.channel;
      const truncatedAt = new Date(0).toISOString();
      act(() =>
        dispatchChannelTruncatedEvent(chatClient, {
          ...channelToTruncate,
          truncated_at: truncatedAt,
        }),
      );

      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(channelToTruncate.cid)).toBeTruthy();
        expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === channelToTruncate.cid);

        expect(matchingMessagesRows.length).toBe(channelResponse.messages.length);
      });
    });

    it('should gracefully handle a truncated_at date after each message', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const channelResponse = channels[getRandomInt(0, channels.length - 1)];
      const channelToTruncate = channelResponse.channel;
      const messages = channelResponse.messages;
      const latestTimestamp = Math.max(...messages.map((m) => new Date(m.created_at).getTime()));
      // truncate at the middle
      const truncatedAt = new Date(latestTimestamp + 1).toISOString();
      act(() =>
        dispatchChannelTruncatedEvent(chatClient, {
          ...channelToTruncate,
          truncated_at: truncatedAt,
        }),
      );

      await waitFor(async () => {
        const channelIdsOnUI = screen
          .queryAllByLabelText('list-item')
          .map((node) => node._fiber.pendingProps.testID);
        expect(channelIdsOnUI.includes(channelToTruncate.cid)).toBeTruthy();
        expectCIDsOnUIToBeInDB(screen.queryAllByLabelText);

        const messagesRows = await BetterSqlite.selectFromTable('messages');
        const matchingMessagesRows = messagesRows.filter((m) => m.cid === channelToTruncate.cid);

        expect(matchingMessagesRows.length).toBe(0);
      });
    });

    it('should add a reaction to DB when a new reaction is added', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReaction = generateReaction({
        message_id: targetMessage.id,
        type: 'wow',
        user: reactionMember.user,
      });
      const messageWithNewReaction = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions, newReaction],
      };

      act(() =>
        dispatchReactionNewEvent(
          chatClient,
          newReaction,
          messageWithNewReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.type === newReaction.type &&
            r.userId === reactionMember.user.id &&
            r.messageId === messageWithNewReaction.id,
        );

        expect(matchingReactionsRows.length).toBe(1);
      });
    });

    it('should correctly add multiple reactions to the DB', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];
      const someOtherMember = targetChannel.members.filter(
        (member) => reactionMember.user.id !== member.user.id,
      )[getRandomInt(0, targetChannel.members.length - 2)];

      const newReactions = [
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: reactionMember.user,
        }),
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: someOtherMember.user,
        }),
        generateReaction({
          message_id: targetMessage.id,
          type: 'love',
          user: reactionMember.user,
        }),
      ];
      const messageWithNewReactionBase = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions],
      };
      const newLatestReactions = [];

      newReactions.forEach((newReaction) => {
        newLatestReactions.push(newReaction);
        const messageWithNewReaction = {
          ...messageWithNewReactionBase,
          latest_reactions: [...messageWithNewReactionBase.latest_reactions, ...newLatestReactions],
        };
        act(() =>
          dispatchReactionNewEvent(
            chatClient,
            newReaction,
            messageWithNewReaction,
            targetChannel.channel,
          ),
        );
      });

      const finalReactionCount =
        messageWithNewReactionBase.latest_reactions.length +
        newReactions.filter(
          (newReaction) =>
            !messageWithNewReactionBase.latest_reactions.some(
              (initialReaction) =>
                initialReaction.type === newReaction.type &&
                initialReaction.user.id === newReaction.user.id,
            ),
        ).length;

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) => r.messageId === messageWithNewReactionBase.id,
        );

        expect(matchingReactionsRows.length).toBe(finalReactionCount);
        newReactions.forEach((newReaction) => {
          expect(
            matchingReactionsRows.filter(
              (reaction) =>
                reaction.type === newReaction.type && reaction.userId === newReaction.user.id,
            ).length,
          ).toBe(1);
        });
      });
    });

    it('should gracefully handle multiple reaction.new events of the same type for the same user', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReactions = [
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: reactionMember.user,
        }),
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: reactionMember.user,
        }),
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: reactionMember.user,
        }),
      ];
      const messageWithNewReactionBase = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions],
      };
      const newLatestReactions = [];

      newReactions.forEach((newReaction) => {
        newLatestReactions.push(newReaction);
        const messageWithNewReaction = {
          ...messageWithNewReactionBase,
          latest_reactions: [...messageWithNewReactionBase.latest_reactions, ...newLatestReactions],
        };
        act(() =>
          dispatchReactionNewEvent(
            chatClient,
            newReaction,
            messageWithNewReaction,
            targetChannel.channel,
          ),
        );
      });

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.type === 'wow' &&
            r.userId === reactionMember.user.id &&
            r.messageId === messageWithNewReactionBase.id,
        );

        expect(matchingReactionsRows.length).toBe(1);
      });
    });

    it('should remove a reaction from DB when reaction is deleted', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionsOnTargetMessage = targetMessage.latest_reactions;
      const reactionToBeRemoved =
        reactionsOnTargetMessage[getRandomInt(0, reactionsOnTargetMessage.length - 1)];

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.type === reactionToBeRemoved.type &&
            r.userId === reactionToBeRemoved.user_id &&
            r.messageId === targetMessage.id,
        );

        expect(matchingReactionsRows.length).toBe(1);
      });

      const messageWithoutDeletedReaction = {
        ...targetMessage,
        latest_reactions: reactionsOnTargetMessage.filter((r) => r !== reactionToBeRemoved),
      };

      act(() =>
        dispatchReactionDeletedEvent(
          chatClient,
          reactionToBeRemoved,
          messageWithoutDeletedReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const reactionsRowsAfterEvent = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRowsAfterEvent = reactionsRowsAfterEvent.filter(
          (r) =>
            r.type === reactionToBeRemoved.type &&
            r.userId === reactionToBeRemoved.user_id &&
            r.messageId === messageWithoutDeletedReaction.id,
        );

        expect(matchingReactionsRowsAfterEvent.length).toBe(0);
      });
    });

    it('should update a reaction in DB when reaction is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionsOnTargetMessage = targetMessage.latest_reactions;
      const reactionToBeUpdated =
        reactionsOnTargetMessage[getRandomInt(0, reactionsOnTargetMessage.length - 1)];
      reactionToBeUpdated.type = 'wow';

      act(() =>
        dispatchReactionUpdatedEvent(
          chatClient,
          reactionToBeUpdated,
          targetMessage,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.type === reactionToBeUpdated.type &&
            r.userId === reactionToBeUpdated.user_id &&
            r.messageId === targetMessage.id,
        );

        expect(matchingReactionsRows.length).toBe(1);
      });
    });

    it('should correctly upsert reactions when enforce_unique is true', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReactions = [
        generateReaction({
          message_id: targetMessage.id,
          type: 'wow',
          user: reactionMember.user,
        }),
        generateReaction({
          message_id: targetMessage.id,
          type: 'love',
          user: reactionMember.user,
        }),
      ];
      const messageWithNewReactionBase = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions],
      };
      const newLatestReactions = [];

      newReactions.forEach((newReaction) => {
        newLatestReactions.push(newReaction);
        const messageWithNewReaction = {
          ...messageWithNewReactionBase,
          latest_reactions: [...messageWithNewReactionBase.latest_reactions, ...newLatestReactions],
        };
        act(() =>
          dispatchReactionNewEvent(
            chatClient,
            newReaction,
            messageWithNewReaction,
            targetChannel.channel,
          ),
        );
      });

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.messageId === messageWithNewReactionBase.id && r.userId === reactionMember.user.id,
        );

        expect(matchingReactionsRows.length).toBe(2);
        newReactions.forEach((newReaction) => {
          expect(
            matchingReactionsRows.filter(
              (reaction) =>
                reaction.type === newReaction.type && reaction.userId === newReaction.user.id,
            ).length,
          ).toBe(1);
        });
      });

      const uniqueReaction = generateReaction({
        message_id: targetMessage.id,
        type: 'like',
        user: reactionMember.user,
      });
      const messageWithNewReaction = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions, uniqueReaction],
      };

      act(() =>
        dispatchReactionUpdatedEvent(
          chatClient,
          uniqueReaction,
          messageWithNewReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const reactionsRows = await BetterSqlite.selectFromTable('reactions');
        const matchingReactionsRows = reactionsRows.filter(
          (r) =>
            r.type === uniqueReaction.type &&
            r.userId === reactionMember.user.id &&
            r.messageId === messageWithNewReaction.id,
        );

        expect(matchingReactionsRows.length).toBe(1);
      });
    });

    it('should also update the corresponding message.reaction_groups with reaction.new', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReaction = generateReaction({
        message_id: targetMessage.id,
        type: 'wow',
        user: reactionMember.user,
      });
      const newDate = new Date().toISOString();
      // the actual content of the reaction_groups does not matter, as we just want to know if it updates to it
      // anything impossible given the scenarios is fine
      const messageWithNewReaction = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions, newReaction],
        reaction_groups: {
          ...targetMessage.reaction_groups,
          [newReaction.type]: {
            count: 999,
            first_reaction_at: newDate,
            last_reaction_at: newDate,
            sum_scores: 999,
          },
        },
      };

      act(() =>
        dispatchReactionNewEvent(
          chatClient,
          newReaction,
          messageWithNewReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const messageRows = await BetterSqlite.selectFromTable('messages');
        const messageWithReactionRow = messageRows.filter(
          (m) => m.id === messageWithNewReaction.id,
        )[0];

        const reactionGroups = JSON.parse(messageWithReactionRow.reactionGroups);

        expect(reactionGroups[newReaction.type]?.count).toBe(999);
        expect(reactionGroups[newReaction.type]?.sum_scores).toBe(999);
        expect(reactionGroups[newReaction.type]?.first_reaction_at).toBe(newDate);
        expect(reactionGroups[newReaction.type]?.last_reaction_at).toBe(newDate);
      });
    });

    it('should also update the corresponding message.reaction_groups with reaction.updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReaction = generateReaction({
        message_id: targetMessage.id,
        type: 'wow',
        user: reactionMember.user,
      });
      const newDate = new Date().toISOString();
      const messageWithNewReaction = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions, newReaction],
        reaction_groups: {
          ...targetMessage.reaction_groups,
          [newReaction.type]: {
            count: 999,
            first_reaction_at: newDate,
            last_reaction_at: newDate,
            sum_scores: 999,
          },
        },
      };

      act(() =>
        dispatchReactionUpdatedEvent(
          chatClient,
          newReaction,
          messageWithNewReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const messageRows = await BetterSqlite.selectFromTable('messages');
        const messageWithReactionRow = messageRows.filter(
          (m) => m.id === messageWithNewReaction.id,
        )[0];

        const reactionGroups = JSON.parse(messageWithReactionRow.reactionGroups);

        expect(reactionGroups[newReaction.type]?.count).toBe(999);
        expect(reactionGroups[newReaction.type]?.sum_scores).toBe(999);
        expect(reactionGroups[newReaction.type]?.first_reaction_at).toBe(newDate);
        expect(reactionGroups[newReaction.type]?.last_reaction_at).toBe(newDate);
      });
    });

    it('should also update the corresponding message.reaction_groups with reaction.deleted', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionMember =
        targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const newReaction = generateReaction({
        message_id: targetMessage.id,
        type: 'wow',
        user: reactionMember.user,
      });
      const newDate = new Date().toISOString();
      const messageWithNewReaction = {
        ...targetMessage,
        latest_reactions: [...targetMessage.latest_reactions, newReaction],
        reaction_groups: {
          ...targetMessage.reaction_groups,
          [newReaction.type]: {
            count: 999,
            first_reaction_at: newDate,
            last_reaction_at: newDate,
            sum_scores: 999,
          },
        },
      };

      act(() =>
        dispatchReactionDeletedEvent(
          chatClient,
          newReaction,
          messageWithNewReaction,
          targetChannel.channel,
        ),
      );

      await waitFor(async () => {
        const messageRows = await BetterSqlite.selectFromTable('messages');
        const messageWithReactionRow = messageRows.filter(
          (m) => m.id === messageWithNewReaction.id,
        )[0];

        const reactionGroups = JSON.parse(messageWithReactionRow.reactionGroups);

        expect(reactionGroups[newReaction.type]?.count).toBe(999);
        expect(reactionGroups[newReaction.type]?.sum_scores).toBe(999);
        expect(reactionGroups[newReaction.type]?.first_reaction_at).toBe(newDate);
        expect(reactionGroups[newReaction.type]?.last_reaction_at).toBe(newDate);
      });
    });

    it('should add a member to DB when a new member is added to channel', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      renderComponent();

      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[getRandomInt(0, channels.length - 1)];

      const oldMemberCount = targetChannel.channel.member_count;
      const newMember = generateMember();
      act(() => dispatchMemberAddedEvent(chatClient, newMember, targetChannel.channel));

      await waitFor(async () => {
        const membersRows = await BetterSqlite.selectFromTable('members');
        const channelRows = await BetterSqlite.selectFromTable('channels');
        const matchingMembersRows = membersRows.filter(
          (m) => m.cid === targetChannel.channel.cid && m.userId === newMember.user_id,
        );
        const targetChannelFromDb = channelRows.filter(
          (c) => c.cid === targetChannel.channel.cid,
        )[0];

        expect(matchingMembersRows.length).toBe(1);
        expect(targetChannelFromDb.memberCount).toBe(oldMemberCount + 1);
      });
    });

    it('should remove a member from DB when a member is removed from channel', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];
      const oldMemberCount = targetChannel.channel.member_count;
      act(() => dispatchMemberRemovedEvent(chatClient, targetMember, targetChannel.channel));

      await waitFor(async () => {
        const membersRows = await BetterSqlite.selectFromTable('members');
        const channelRows = await BetterSqlite.selectFromTable('channels');
        const matchingMembersRows = membersRows.filter(
          (m) => m.cid === targetChannel.channel.cid && m.userId === targetMember.user_id,
        );
        const targetChannelFromDb = channelRows.filter(
          (c) => c.cid === targetChannel.channel.cid,
        )[0];

        expect(matchingMembersRows.length).toBe(0);
        expect(targetChannelFromDb.memberCount).toBe(oldMemberCount - 1);
      });
    });

    it('should update the member in DB when a member of a channel is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];
      targetMember.role = 'admin';
      act(() => dispatchMemberUpdatedEvent(chatClient, targetMember, targetChannel.channel));

      await waitFor(async () => {
        const membersRows = await BetterSqlite.selectFromTable('members');
        const matchingMembersRows = membersRows.filter(
          (m) =>
            m.cid === targetChannel.channel.cid &&
            m.userId === targetMember.user_id &&
            m.role === targetMember.role,
        );

        expect(matchingMembersRows.length).toBe(1);
        expect(matchingMembersRows[0].role).toBe(targetMember.role);
      });
    });

    it('should update the channel data in DB when a channel is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      targetChannel.channel.name = uuidv4();
      act(() => dispatchChannelUpdatedEvent(chatClient, targetChannel.channel));

      await waitFor(async () => {
        const channelsRows = await BetterSqlite.selectFromTable('channels');
        const matchingChannelsRows = channelsRows.filter(
          (c) => c.cid === targetChannel.channel.cid,
        );

        expect(matchingChannelsRows.length).toBe(1);

        const extraData = JSON.parse(matchingChannelsRows[0].extraData);

        expect(extraData.name).toBe(targetChannel.channel.name);
      });
    });

    it('should update reads in DB when channel is read', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      const readTimestamp = new Date().toISOString();

      act(() => {
        dispatchMessageReadEvent(chatClient, targetMember.user, targetChannel.channel, {
          first_unread_message_id: '123',
          last_read: readTimestamp,
          last_read_message_id: '321',
        });
      });

      await waitFor(async () => {
        const readsRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readsRows.filter(
          (r) => r.userId === targetMember.user_id && r.cid === targetChannel.cid,
        );

        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(0);
        expect(matchingReadRows[0].lastReadMessageId).toBe('321');
        // FIXME: Currently missing from the DB, uncomment when added.
        // expect(matchingReadRows[0].firstUnreadMessageId).toBe('123');
        expect(matchingReadRows[0].lastRead).toBe(readTimestamp);
      });
    });

    it('should update reads in DB when a channel is marked as unread', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await act(async () => await chatClient.offlineDb.syncManager.invokeSyncStatusListeners(true));
      await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      chatClient.userID = targetMember.user.id;
      chatClient.user = targetMember.user;

      const readTimestamp = new Date().toISOString();

      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          targetChannel.channel,
          {
            first_unread_message_id: '123',
            last_read: readTimestamp,
            last_read_message_id: '321',
            unread_messages: 5,
          },
          targetMember.user,
        );
      });

      await waitFor(async () => {
        const readsRows = await BetterSqlite.selectFromTable('reads');
        const matchingReadRows = readsRows.filter(
          (r) => r.userId === targetMember.user_id && r.cid === targetChannel.cid,
        );

        expect(matchingReadRows.length).toBe(1);
        expect(matchingReadRows[0].unreadMessages).toBe(5);
        expect(matchingReadRows[0].lastReadMessageId).toBe('321');
        // FIXME: Currently missing from the DB, uncomment when added.
        // expect(matchingReadRows[0].firstUnreadMessageId).toBe('123');
        expect(matchingReadRows[0].lastRead).toBe(readTimestamp);
      });
    });
  });
};
