/* eslint-disable no-underscore-dangle */
/* eslint-disable jest/no-export */
import React from 'react';
import { Text, View } from 'react-native';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import { v4 as uuidv4 } from 'uuid';

import { ChannelList } from '../../components/ChannelList/ChannelList';
import { Chat } from '../../components/Chat/Chat';
import { useChannelsContext } from '../../contexts/channelsContext/ChannelsContext';
import { getOrCreateChannelApi } from '../../mock-builders/api/getOrCreateChannel';
import { queryChannelsApi } from '../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../mock-builders/api/useMockedApis';
import dispatchChannelTruncatedEvent from '../../mock-builders/event/channelTruncated';
import dispatchChannelUpdatedEvent from '../../mock-builders/event/channelUpdated';
import dispatchConnectionChangedEvent from '../../mock-builders/event/connectionChanged';
import dispatchMemberAddedEvent from '../../mock-builders/event/memberAdded';
import dispatchMemberRemovedEvent from '../../mock-builders/event/memberRemoved';
import dispatchMemberUpdatedEvent from '../../mock-builders/event/memberUpdated';
import dispatchMessageNewEvent from '../../mock-builders/event/messageNew';
import dispatchMessageReadEvent from '../../mock-builders/event/messageRead';
import dispatchMessageUpdatedEvent from '../../mock-builders/event/messageUpdated';
import dispatchNotificationAddedToChannel from '../../mock-builders/event/notificationAddedToChannel';
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
import { QuickSqliteClient } from '../../store/QuickSqliteClient';
import { tables } from '../../store/schema';
import { BetterSqlite } from '../../test-utils/BetterSqlite';

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
  if (!channels) return null;

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

    beforeEach(async () => {
      jest.clearAllMocks();
      chatClient = await getTestClientWithUser({ id: 'dan' });
      QuickSqliteClient.dropTables();
      QuickSqliteClient.closeDB();
    });

    afterEach(() => {
      QuickSqliteClient.dropTables();
      QuickSqliteClient.closeDB();
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
    let channels;

    let allUsers;
    let allMessages;
    let allMembers;
    let allReactions;
    let allReads;
    const getRandomInt = (lower, upper) => Math.floor(lower + Math.random() * (upper - lower + 1));
    const createChannel = () => {
      const id = uuidv4();
      const cid = `messaging:${id}`;
      const begin = getRandomInt(0, allUsers.length - 2); // begin shouldn't be the end of users.length
      const end = getRandomInt(begin + 1, allUsers.length - 1);
      const usersForMembers = allUsers.slice(begin, end);
      const members = usersForMembers.map((user) =>
        generateMember({
          cid,
          user,
        }),
      );
      const messages = Array(10)
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
        last_read: new Date(new Date().setDate(new Date().getDate() - getRandomInt(0, 20))),
        unread_messages: getRandomInt(0, messages.length),
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
      });
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      allUsers = Array(20).fill(1).map(generateUser);
      allMessages = [];
      allMembers = [];
      allReactions = [];
      allReads = [];
      channels = Array(10)
        .fill(1)
        .map(() => createChannel());

      chatClient = await getTestClientWithUser({ id: 'dan' });
      BetterSqlite.dropAllTables();
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

    const expectCIDsOnUIToBeInDB = (queryAllByA11yRole) => {
      const channelIdsOnUI = queryAllByA11yRole('list-item').map(
        (node) => node._fiber.pendingProps.testID,
      );

      const channelQueriesRows = BetterSqlite.selectFromTable('channelQueries');
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
    };

    const expectAllChannelsWithStateToBeInDB = (queryAllByA11yRole) => {
      const channelIdsOnUI = queryAllByA11yRole('list-item').map(
        (node) => node._fiber.pendingProps.testID,
      );

      const channelsRows = BetterSqlite.selectFromTable('channels');
      const messagesRows = BetterSqlite.selectFromTable('messages');
      const membersRows = BetterSqlite.selectFromTable('members');
      const usersRows = BetterSqlite.selectFromTable('users');
      const reactionsRows = BetterSqlite.selectFromTable('reactions');
      const readsRows = BetterSqlite.selectFromTable('reads');

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
          allReads.filter(
            (r) =>
              r.last_read === row.lastRead &&
              r.user.id === row.userId &&
              r.unread_messages === row.unreadMessages,
          ),
        ).toHaveLength(1),
      );
    };

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
      useMockedApis(chatClient, [queryChannelsApi(channels)]);
      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      // await waiter();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      expectCIDsOnUIToBeInDB(queryAllByA11yRole);
    });

    it('should store channels and its state in tables', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      expectAllChannelsWithStateToBeInDB(queryAllByA11yRole);
    });

    it('should add a new message to database', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
      const newMessage = generateMessage({
        cid: channels[0].channel.cid,
        user: generateUser(),
      });
      act(() => dispatchMessageNewEvent(chatClient, newMessage, channels[0].channel));

      const messagesRows = BetterSqlite.selectFromTable('messages');
      const matchingRows = messagesRows.filter((m) => m.id === newMessage.id);

      expect(matchingRows.length).toBe(1);
    });

    it('should add a new channel and a new message to database from notification event', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const newChannel = createChannel();
      channels.push(newChannel);
      useMockedApis(chatClient, [getOrCreateChannelApi(newChannel)]);

      act(() => dispatchNotificationMessageNewEvent(chatClient, newChannel.channel));
      await waitFor(() => {
        const channelIdsOnUI = queryAllByA11yRole('list-item').map(
          (node) => node._fiber.pendingProps.testID,
        );
        expect(channelIdsOnUI.includes(newChannel.channel.cid)).toBeTruthy();
      });

      expectAllChannelsWithStateToBeInDB(queryAllByA11yRole);
    });

    it('should update a message in database', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const updatedMessage = { ...channels[0].messages[0] };
      updatedMessage.text = uuidv4();

      act(() => dispatchMessageUpdatedEvent(chatClient, updatedMessage, channels[0].channel));

      const messagesRows = BetterSqlite.selectFromTable('messages');
      const matchingRows = messagesRows.filter((m) => m.id === updatedMessage.id);

      expect(matchingRows.length).toBe(1);
      expect(matchingRows[0].text).toBe(updatedMessage.text);
    });

    it('should remove the channel from DB when user is removed as member', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
      const removedChannel = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchNotificationRemovedFromChannel(chatClient, removedChannel));
      await waitFor(() => {
        const channelIdsOnUI = queryAllByA11yRole('list-item').map(
          (node) => node._fiber.pendingProps.testID,
        );
        expect(channelIdsOnUI.includes(removedChannel.cid)).toBeFalsy();
      });

      expectCIDsOnUIToBeInDB(queryAllByA11yRole);

      const channelsRows = BetterSqlite.selectFromTable('channels');
      const matchingRows = channelsRows.filter((c) => c.id === removedChannel.id);

      const messagesRows = BetterSqlite.selectFromTable('messages');
      const matchingMessagesRows = messagesRows.filter((m) => m.cid === removedChannel.cid);

      expect(matchingRows.length).toBe(0);
      expect(matchingMessagesRows.length).toBe(0);
    });

    it('should add the channel to DB when user is added as member', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const newChannel = createChannel();
      useMockedApis(chatClient, [getOrCreateChannelApi(newChannel)]);

      act(() => dispatchNotificationAddedToChannel(chatClient, newChannel.channel));

      await waitFor(() => {
        const channelIdsOnUI = queryAllByA11yRole('list-item').map(
          (node) => node._fiber.pendingProps.testID,
        );
        expect(channelIdsOnUI.includes(newChannel.channel.cid)).toBeTruthy();
      });

      expectCIDsOnUIToBeInDB(queryAllByA11yRole);
      const channelsRows = BetterSqlite.selectFromTable('channels');
      const matchingChannelsRows = channelsRows.filter((c) => c.id === newChannel.channel.id);

      const messagesRows = BetterSqlite.selectFromTable('messages');
      const matchingMessagesRows = messagesRows.filter((m) => m.cid === newChannel.channel.cid);

      expect(matchingChannelsRows.length).toBe(1);
      expect(matchingMessagesRows.length).toBe(newChannel.messages.length);
    });

    it('should remove the channel messages from DB when channel is truncated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId, queryAllByA11yRole } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const channelToTruncate = channels[getRandomInt(0, channels.length - 1)].channel;
      act(() => dispatchChannelTruncatedEvent(chatClient, channelToTruncate));

      await waitFor(() => {
        const channelIdsOnUI = queryAllByA11yRole('list-item').map(
          (node) => node._fiber.pendingProps.testID,
        );
        expect(channelIdsOnUI.includes(channelToTruncate.cid)).toBeTruthy();
      });

      expectCIDsOnUIToBeInDB(queryAllByA11yRole);

      const messagesRows = BetterSqlite.selectFromTable('messages');
      const matchingMessagesRows = messagesRows.filter((m) => m.cid === channelToTruncate.cid);

      expect(matchingMessagesRows.length).toBe(0);
    });

    it('should add a reaction to DB when a new reaction is added', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

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

      const reactionsRows = BetterSqlite.selectFromTable('reactions');
      const matchingReactionsRows = reactionsRows.filter(
        (r) =>
          r.type === newReaction.type &&
          r.userId === reactionMember.user.id &&
          r.messageId === messageWithNewReaction.id,
      );

      expect(matchingReactionsRows.length).toBe(1);
    });

    it('should remove a reaction from DB when reaction is deleted', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMessage =
        targetChannel.messages[getRandomInt(0, targetChannel.messages.length - 1)];
      const reactionsOnTargetMessage = targetMessage.latest_reactions;
      const reactionToBeRemoved =
        reactionsOnTargetMessage[getRandomInt(0, reactionsOnTargetMessage.length - 1)];

      const reactionsRows = BetterSqlite.selectFromTable('reactions');
      const matchingReactionsRows = reactionsRows.filter(
        (r) =>
          r.type === reactionToBeRemoved.type &&
          r.userId === reactionToBeRemoved.user_id &&
          r.messageId === targetMessage.id,
      );

      expect(matchingReactionsRows.length).toBe(1);
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

      const reactionsRowsAfterEvent = BetterSqlite.selectFromTable('reactions');
      const matchingReactionsRowsAfterEvent = reactionsRowsAfterEvent.filter(
        (r) =>
          r.type === reactionToBeRemoved.type &&
          r.userId === reactionToBeRemoved.user_id &&
          r.messageId === messageWithoutDeletedReaction.id,
      );

      expect(matchingReactionsRowsAfterEvent.length).toBe(0);
    });

    it('should update a reaction in DB when reaction is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

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
      const reactionsRows = BetterSqlite.selectFromTable('reactions');
      const matchingReactionsRows = reactionsRows.filter(
        (r) =>
          r.type === reactionToBeUpdated.type &&
          r.userId === reactionToBeUpdated.user_id &&
          r.messageId === targetMessage.id,
      );

      expect(matchingReactionsRows.length).toBe(1);
    });

    it('should add a member to DB when a new member is added to channel', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const newMember = generateMember();
      act(() => dispatchMemberAddedEvent(chatClient, newMember, targetChannel.channel));

      const membersRows = BetterSqlite.selectFromTable('members');
      const matchingMembersRows = membersRows.filter(
        (m) => m.cid === targetChannel.channel.cid && m.userId === newMember.user_id,
      );

      expect(matchingMembersRows.length).toBe(1);
    });

    it('should remove a member from DB when a member is removed from channel', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];
      act(() => dispatchMemberRemovedEvent(chatClient, targetMember, targetChannel.channel));

      const membersRows = BetterSqlite.selectFromTable('members');
      const matchingMembersRows = membersRows.filter(
        (m) => m.cid === targetChannel.channel.cid && m.userId === targetMember.user_id,
      );

      expect(matchingMembersRows.length).toBe(0);
    });

    it('should update the member in DB when a member of a channel is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];
      targetMember.role = 'admin';
      act(() => dispatchMemberUpdatedEvent(chatClient, targetMember, targetChannel.channel));

      const membersRows = BetterSqlite.selectFromTable('members');
      const matchingMembersRows = membersRows.filter(
        (m) =>
          m.cid === targetChannel.channel.cid &&
          m.userId === targetMember.user_id &&
          m.role === targetMember.role,
      );

      expect(matchingMembersRows.length).toBe(1);
      expect(matchingMembersRows[0].role).toBe(targetMember.role);
    });

    it('should update the channel data in DB when a channel is updated', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      targetChannel.channel.name = uuidv4();
      act(() => dispatchChannelUpdatedEvent(chatClient, targetChannel.channel));

      const channelsRows = BetterSqlite.selectFromTable('channels');
      const matchingChannelsRows = channelsRows.filter((c) => c.cid === targetChannel.channel.cid);

      expect(matchingChannelsRows.length).toBe(1);

      const extraData = JSON.parse(matchingChannelsRows[0].extraData);

      expect(extraData.name).toBe(targetChannel.channel.name);
    });

    it('should update reads in DB when channel is read', async () => {
      useMockedApis(chatClient, [queryChannelsApi(channels)]);

      const { getByTestId } = renderComponent();
      act(() => dispatchConnectionChangedEvent(chatClient));
      await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
      const targetChannel = channels[getRandomInt(0, channels.length - 1)];
      const targetMember = targetChannel.members[getRandomInt(0, targetChannel.members.length - 1)];

      act(() => {
        dispatchMessageReadEvent(chatClient, targetMember.user, targetChannel.channel);
      });
      const readsRows = BetterSqlite.selectFromTable('reads');
      const matchingReadRows = readsRows.filter(
        (r) => r.userId === targetMember.user_id && r.cid === targetChannel.cid,
      );

      expect(matchingReadRows.length).toBe(1);
      expect(matchingReadRows[0].unreadMessages).toBe(0);
    });
  });
};
