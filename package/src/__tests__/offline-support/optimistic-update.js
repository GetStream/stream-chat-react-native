import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { v4 as uuidv4 } from 'uuid';

import { Channel } from '../../components/Channel/Channel';
import { Chat } from '../../components/Chat/Chat';
import { MessageInputContext, MessagesContext } from '../../contexts';
import { deleteMessageApi } from '../../mock-builders/api/deleteMessage';
import { deleteReactionApi } from '../../mock-builders/api/deleteReaction';
import { erroredDeleteApi, erroredPostApi } from '../../mock-builders/api/error';
import { getOrCreateChannelApi } from '../../mock-builders/api/getOrCreateChannel';
import { sendMessageApi } from '../../mock-builders/api/sendMessage';
import { sendReactionApi } from '../../mock-builders/api/sendReaction';
import { useMockedApis } from '../../mock-builders/api/useMockedApis';
import dispatchConnectionChangedEvent from '../../mock-builders/event/connectionChanged';
import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMember } from '../../mock-builders/generator/member';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateReaction } from '../../mock-builders/generator/reaction';
import { generateUser } from '../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../mock-builders/mock';
import { upsertChannels } from '../../store/apis';
import { SqliteClient } from '../../store/SqliteClient';
import { BetterSqlite } from '../../test-utils/BetterSqlite';

test('Workaround to allow exporting tests', () => expect(true).toBe(true));

export const OptimisticUpdates = () => {
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
      await SqliteClient.initializeDatabase();
      await BetterSqlite.openDB();
      await upsertChannels({
        channels: [channelResponse],
        isLatestMessagesSet: true,
      });
      chatClient.wsConnection = { isHealthy: true, onlineStatusChanged: jest.fn() };
    });

    afterEach(() => {
      BetterSqlite.dropAllTables();
      BetterSqlite.closeDB();
      cleanup();
      jest.clearAllMocks();
    });

    let channel;
    // This component is used for performing effects in a component that consumes ChannelContext,
    // i.e. making use of the callbacks & values provided by the Channel component.
    // the effect is called every time channelContext changes
    const CallbackEffectWithContext = ({ callback, children, context }) => {
      const ctx = useContext(context);
      const [ready, setReady] = useState(false);
      useEffect(() => {
        const call = async () => {
          await callback(ctx);
          setReady(true);
        };

        call();
      }, [callback, ctx]);

      if (!ready) {
        return null;
      }

      return children;
    };

    describe('delete message', () => {
      it('pending task should exist if deleteMessage request fails', async () => {
        const message = generateMessage();

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithContext
                callback={async ({ deleteMessage }) => {
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await deleteMessage(message);
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
          expect(pendingTaskType).toBe('delete-message');
          expect(pendingTaskPayload[0]).toBe(message.id);
        });
      });

      it('pending task should be cleared if deleteMessage request is successful', async () => {
        const message = generateMessage();
        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithContext
                callback={async ({ deleteMessage }) => {
                  useMockedApis(chatClient, [deleteMessageApi(message)]);
                  await deleteMessage(message);
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          expect(pendingTasksRows.length).toBe(0);
        });
      });
    });

    describe('send reaction', () => {
      it('pending task should exist if sendReaction request fails', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.state.messages[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ sendReaction }) => {
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await sendReaction(reaction.type, targetMessage.id);
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
          expect(pendingTaskType).toBe('send-reaction');
          expect(pendingTaskPayload[0]).toBe(targetMessage.id);
        });
      });

      it('pending task should be cleared if sendReaction request is successful', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.state.messages[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ sendReaction }) => {
                  useMockedApis(chatClient, [sendReactionApi(targetMessage, reaction)]);
                  await sendReaction(reaction.type, targetMessage.id);
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          expect(pendingTasksRows.length).toBe(0);
        });
      });
    });

    describe('send message', () => {
      it('pending task should exist if sendMessage request fails', async () => {
        const newMessage = generateMessage();

        jest.spyOn(channel.messageComposer, 'compose').mockResolvedValue({
          localMessage: newMessage,
          message: newMessage,
          options: {},
        });

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await sendMessage();
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessageInputContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
          expect(pendingTaskType).toBe('send-message');
          expect(pendingTaskPayload[0].id).toEqual(newMessage.id);
          expect(pendingTaskPayload[0].text).toEqual(newMessage.text);
        });
      });

      it('pending task should be cleared if sendMessage request is successful', async () => {
        const newMessage = generateMessage();

        // initialValue is needed as a prop to trick the message input ctx into thinking
        // we are sending a message.
        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={newMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  useMockedApis(chatClient, [sendMessageApi(newMessage)]);
                  await sendMessage({ customMessageData: newMessage });
                }}
                context={MessageInputContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          expect(pendingTasksRows.length).toBe(0);
        });
      });
    });

    describe('delete reaction', () => {
      it('pending task should exist if deleteReaction request fails', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.state.messages[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ deleteReaction }) => {
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await deleteReaction(reaction.type, targetMessage.id);
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse(pendingTasksRows?.[0]?.payload || '{}');
          expect(pendingTaskType).toBe('delete-reaction');
          expect(pendingTaskPayload[0]).toBe(targetMessage.id);
        });
      });

      it('pending task should be cleared if deleteReaction request is successful', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.state.messages[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ deleteReaction }) => {
                  useMockedApis(chatClient, [deleteReactionApi(targetMessage, reaction)]);
                  await deleteReaction(reaction.type, targetMessage.id);
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          expect(pendingTasksRows.length).toBe(0);
        });
      });
    });

    describe('pending task execution', () => {
      it('pending task should be executed after connection is recovered', async () => {
        const message = channel.state.messages[0];
        const reaction = generateReaction();

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithContext
                callback={async ({ deleteMessage, sendReaction }) => {
                  useMockedApis(chatClient, [erroredDeleteApi()]);
                  try {
                    await deleteMessage(message);
                  } catch (e) {
                    // do nothing
                  }

                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await sendReaction(reaction.type, message.id);
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessagesContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');

          expect(pendingTasksRows.length).toBe(2);
        });

        const deleteMessageSpy = jest.spyOn(chatClient, '_deleteMessage').mockImplementation();
        const sendReactionSpy = jest.spyOn(channel, '_sendReaction').mockImplementation();

        act(() => dispatchConnectionChangedEvent(chatClient, true));

        await waitFor(() => {
          expect(deleteMessageSpy).toHaveBeenCalled();
          expect(sendReactionSpy).toHaveBeenCalled();
        });
      });

      // This is a separate test so CallbackEffectWithContext does not need to be modified in order
      // to accept multiple contexts. It can be improved in the future.
      it('send message pending task should be executed after connection is recovered', async () => {
        const newMessage = generateMessage();

        jest.spyOn(channel.messageComposer, 'compose').mockResolvedValue({
          localMessage: newMessage,
          message: newMessage,
          options: {},
        });

        // initialValue is needed as a prop to trick the message input ctx into thinking
        // we are sending a message.
        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={newMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await sendMessage();
                  } catch (e) {
                    // do nothing
                  }
                }}
                context={MessageInputContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');

          expect(pendingTasksRows.length).toBe(1);
        });

        const sendMessageSpy = jest.spyOn(channel, '_sendMessage').mockImplementation();

        act(() => dispatchConnectionChangedEvent(chatClient, true));

        await waitFor(() => {
          expect(sendMessageSpy).toHaveBeenCalled();
        });
      });
    });
  });
};
