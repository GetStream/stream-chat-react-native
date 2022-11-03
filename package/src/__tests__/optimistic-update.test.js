/* eslint-disable no-underscore-dangle */
import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import { v4 as uuidv4 } from 'uuid';

import { Channel } from '../components/Channel/Channel';
import { Chat } from '../components/Chat/Chat';
import { MessageInputContext, MessagesContext } from '../contexts';
import { deleteMessageApi } from '../mock-builders/api/deleteMessage';
import { deleteReactionApi } from '../mock-builders/api/deleteReaction';
import { erroredPostApi } from '../mock-builders/api/error';
import { getOrCreateChannelApi } from '../mock-builders/api/getOrCreateChannel';
import { sendMessageApi } from '../mock-builders/api/sendMessage';
import { sendReactionApi } from '../mock-builders/api/sendReaction';
import { useMockedApis } from '../mock-builders/api/useMockedApis';
import dispatchConnectionChangedEvent from '../mock-builders/event/connectionChanged';
import { generateChannelResponse } from '../mock-builders/generator/channel';
import { generateMember } from '../mock-builders/generator/member';
import { generateMessage } from '../mock-builders/generator/message';
import { generateReaction } from '../mock-builders/generator/reaction';
import { generateUser } from '../mock-builders/generator/user';
import { getTestClientWithUser } from '../mock-builders/mock';
import { upsertChannels } from '../store/apis';
import { QuickSqliteClient } from '../store/QuickSqliteClient';
import { BetterSqlite } from '../test-utils/BetterSqlite';

describe('Optimistic Updates', () => {
  let chatClient;

  const getRandomInt = (lower, upper) => Math.floor(lower + Math.random() * (upper - lower + 1));
  const createChannel = () => {
    const allUsers = Array(20).fill(1).map(generateUser);
    const allMessages = [];
    const allMembers = [];
    const allReactions = [];
    const allReads = [];
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

    chatClient = await getTestClientWithUser({ id: 'dan' });
    const channelResponse = createChannel();
    useMockedApis(chatClient, [getOrCreateChannelApi(channelResponse)]);
    channel = chatClient.channel('messaging', channelResponse.id);
    await channel.watch();

    channel.cid = channelResponse.channel.cid;
    channel.id = channelResponse.channel.id;

    // Populate the DB with channel
    QuickSqliteClient.initializeDatabase();
    upsertChannels({
      channels: [channelResponse],
      isLatestMessagesSet: true,
    });
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    cleanup();
  });

  let channel;
  // This component is used for performing effects in a component that consumes ChannelContext,
  // i.e. making use of the callbacks & values provided by the Channel component.
  // the effect is called every time channelContext changes
  const CallbackEffectWithContext = ({ callback, children, context }) => {
    const ctx = useContext(context);
    useEffect(() => {
      callback(ctx);
    }, []);

    return children;
  };

  describe('sending message', () => {
    it('pending task should exist if sendMessage request fails', async () => {
      const message = generateMessage();

      // Just to suppress the log of error from api call, since we are expecting it to fails.
      // There is no point in cluttering the test logs with those errors.
      console.log = jest.fn();

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel} initialValue={message.text}>
            <CallbackEffectWithContext
              callback={({ sendMessage }) => {
                useMockedApis(chatClient, [erroredPostApi()]);
                sendMessage(message);
              }}
              context={MessageInputContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        const pendingTaskType = pendingTasksRows?.[0]?.type;
        const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
        expect(pendingTaskType).toBe('send-message');
        expect(pendingTaskPayload[0].text).toBe(message.text);
      });
    });

    it('pending task should be cleared if sendMessage request succeedes', async () => {
      const message = generateMessage();
      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel} initialValue={message.text}>
            <CallbackEffectWithContext
              callback={({ sendMessage }) => {
                useMockedApis(chatClient, [sendMessageApi(message)]);
                sendMessage(message);
              }}
              context={MessageInputContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        expect(pendingTasksRows.length).toBe(0);
      });
    });
  });

  describe('delete message', () => {
    it('pending task should exist if deleteMessage request fails', async () => {
      const message = generateMessage();

      // Just to suppress the log of error from api call, since we are expecting it to fails.
      // There is no point in cluttering the test logs with those errors.
      console.log = jest.fn();

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel} initialValue={message.text}>
            <CallbackEffectWithContext
              callback={({ deleteMessage }) => {
                useMockedApis(chatClient, [erroredPostApi()]);
                deleteMessage(message);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        const pendingTaskType = pendingTasksRows?.[0]?.type;
        const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
        expect(pendingTaskType).toBe('delete-message');
        expect(pendingTaskPayload[0]).toBe(message.id);
      });
    });

    it('pending task should be cleared if deleteMessage request is succesful', async () => {
      const message = generateMessage();
      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel} initialValue={message.text}>
            <CallbackEffectWithContext
              callback={({ deleteMessage }) => {
                useMockedApis(chatClient, [deleteMessageApi(message)]);
                deleteMessage(message);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        expect(pendingTasksRows.length).toBe(0);
      });
    });
  });

  describe('send reaction', () => {
    it('pending task should exist if sendReaction request fails', async () => {
      const reaction = generateReaction();
      const targetMessage = channel.state.messages[0];
      // Just to suppress the log of error from api call, since we are expecting it to fails.
      // There is no point in cluttering the test logs with those errors.
      console.log = jest.fn();

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ sendReaction }) => {
                useMockedApis(chatClient, [erroredPostApi()]);
                sendReaction(reaction.type, targetMessage.id);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        const pendingTaskType = pendingTasksRows?.[0]?.type;
        const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
        expect(pendingTaskType).toBe('send-reaction');
        expect(pendingTaskPayload[0]).toBe(targetMessage.id);
      });
    });

    it('pending task should be cleared if sendReaction request is succesful', async () => {
      const reaction = generateReaction();
      const targetMessage = channel.state.messages[0];

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ sendReaction }) => {
                useMockedApis(chatClient, [sendReactionApi(targetMessage, reaction)]);
                sendReaction(reaction.type, targetMessage.id);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        expect(pendingTasksRows.length).toBe(0);
      });
    });
  });

  describe('delete reaction', () => {
    it('pending task should exist if deleteReaction request fails', async () => {
      const reaction = generateReaction();
      const targetMessage = channel.state.messages[0];
      // Just to suppress the log of error from api call, since we are expecting it to fails.
      // There is no point in cluttering the test logs with those errors.
      console.log = jest.fn();

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ deleteReaction }) => {
                useMockedApis(chatClient, [erroredPostApi()]);
                deleteReaction(reaction.type, targetMessage.id);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        const pendingTaskType = pendingTasksRows?.[0]?.type;
        const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
        expect(pendingTaskType).toBe('delete-reaction');
        expect(pendingTaskPayload[0]).toBe(targetMessage.id);
      });
    });

    it('pending task should be cleared if deleteReaction request is succesful', async () => {
      const reaction = generateReaction();
      const targetMessage = channel.state.messages[0];

      const { getByTestId } = render(
        <Chat client={chatClient} enableOfflineSupport>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ deleteReaction }) => {
                useMockedApis(chatClient, [deleteReactionApi(targetMessage, reaction)]);
                deleteReaction(reaction.type, targetMessage.id);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </Channel>
        </Chat>,
      );
      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
      await waitFor(() => {
        const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
        expect(pendingTasksRows.length).toBe(0);
      });
    });
  });

  it('pending task should be executed after connection is recovered', async () => {
    const message = generateMessage();
    const reaction = generateReaction();

    // Just to suppress the log of error from api call, since we are expecting it to fails.
    // There is no point in cluttering the test logs with those errors.
    console.log = jest.fn();

    const { getByTestId } = render(
      <Chat client={chatClient} enableOfflineSupport>
        <Channel channel={channel} initialValue={message.text}>
          <CallbackEffectWithContext
            callback={async ({ sendMessage }) => {
              useMockedApis(chatClient, [erroredPostApi()]);
              await sendMessage(message);
            }}
            context={MessageInputContext}
          >
            <CallbackEffectWithContext
              callback={async ({ sendReaction }) => {
                useMockedApis(chatClient, [erroredPostApi()]);
                await sendReaction(reaction.type, message.id);
              }}
              context={MessagesContext}
            >
              <View testID='children' />
            </CallbackEffectWithContext>
          </CallbackEffectWithContext>
        </Channel>
      </Chat>,
    );
    await waitFor(() => expect(getByTestId('children')).toBeTruthy());

    await waitFor(() => {
      const pendingTasksRows = BetterSqlite.selectFromTable('pendingTasks');
      expect(pendingTasksRows.length).toBe(2);
    });

    channel.sendMessage = jest.fn();
    channel.sendReaction = jest.fn();

    act(() => dispatchConnectionChangedEvent(chatClient, true));

    await waitFor(() => {
      expect(channel.sendMessage).toHaveBeenCalled();
      expect(channel.sendReaction).toHaveBeenCalled();
    });
  });
});
