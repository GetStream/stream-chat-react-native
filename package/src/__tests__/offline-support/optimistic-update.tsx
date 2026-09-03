import React, { useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import type {
  Channel as ChannelLLC,
  ChannelMemberResponse,
  LocalMessage,
  ReactionResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import { dateToNs, localMessageToNewMessagePayload, nowNs } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import { Channel as ChannelRaw } from '../../components/Channel/Channel';
import { Chat } from '../../components/Chat/Chat';
import {
  MessageOperations,
  useMessageOperations,
} from '../../components/Message/hooks/useMessageOperations';
import { MessageInputContext } from '../../contexts';
import { deleteMessageApi } from '../../mock-builders/api/deleteMessage';
import { deleteReactionApi } from '../../mock-builders/api/deleteReaction';
import { erroredDeleteApi, erroredPostApi } from '../../mock-builders/api/error';
import { getOrCreateChannelApi } from '../../mock-builders/api/getOrCreateChannel';
import { sendMessageApi } from '../../mock-builders/api/sendMessage';
import { sendReactionApi } from '../../mock-builders/api/sendReaction';
import { useMockedApis } from '../../mock-builders/api/useMockedApis';
import { generateFileReference } from '../../mock-builders/attachments';
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
import { MessageStatusTypes } from '../../utils/utils';

// `initialValue` is not part of Channel's props today, but these legacy tests pass it to
// mimic a pre-populated input. Keep the runtime behavior unchanged and widen the prop type
// at the component boundary so TS stops complaining.
const Channel = ChannelRaw as unknown as React.ComponentType<
  React.ComponentProps<typeof ChannelRaw> & { initialValue?: string }
>;

// Tests reach into internal / private StreamChat + LLC Channel APIs (sync manager, legacy
// `wsConnection`, `_deleteMessage`, `_sendReaction`, `_sendMessage`). Helpers narrow at the
// call sites without sprinkling `any` everywhere.
type TestPendingTask = { id: number; type: string; payload: unknown };
type TestSyncManager = {
  invokeSyncStatusListeners: (recovered: boolean) => Promise<void>;
};
// Intentionally not intersected with the real `StreamChat['offlineDb']` — the
// real `syncManager` member is a class with `invokeSyncStatusListeners` marked
// private, which conflicts with the test-only accessor. Kept as a standalone
// test shim shape.
type TestOfflineDb = {
  addPendingTask: (task: {
    channelId: string | undefined;
    channelType: string;
    messageId: string;
    payload: unknown;
    type: string;
  }) => Promise<void>;
  deletePendingTask: (params: { id: number }) => Promise<void>;
  getPendingTasks: () => Promise<TestPendingTask[]>;
  upsertMessages: (params: { execute?: boolean; messages: unknown[] }) => Promise<unknown>;
  syncManager: TestSyncManager;
};
const getOfflineDb = (client: StreamChat): TestOfflineDb =>
  client.offlineDb as unknown as TestOfflineDb;

// Forces the client offline. `queueTask` then short-circuits to a connection-lost (ephemeral)
// failure and persists the task for replay — the WORKING offline-queue path. This is the real v10
// queue trigger: `queueTask` only persists a pending task when the failure is EPHEMERAL (offline /
// connection-loss / a retryable code); a definitive server rejection (e.g. a plain 500) is skipped
// by design (BC48), since retrying it would never succeed. The "pending task should exist if ...
// request fails" tests below therefore force this offline case (they still pass an errored API mock,
// but the offline short-circuit is what queues the task), NOT a raw 500.
const markConnectionUnhealthy = (client: StreamChat) => {
  (client.wsConnection as unknown as { isHealthy: boolean }).isHealthy = false;
};

/** The counterpart of {@link markConnectionUnhealthy}, for tests that go offline and then reconnect. */
const markConnectionHealthy = (client: StreamChat) => {
  (client.wsConnection as unknown as { isHealthy: boolean }).isHealthy = true;
};

// React flushes passive effects child-first, so the test-callback effect below runs BEFORE `Channel`'s
// own mount effects — verifiably: without this wait, `channel.configState.requestHandlers` at edit time
// holds only the declaratively-registered `updateMessageRequest`, with no `sendMessageRequest`, because
// `useChannelRequestHandlers` has not run yet.
//
// An operation fired from that window races `Channel`'s own offline-DB persistence of the initial query
// result. The in-memory paginator is fine either way; the DB row is not. Observed across repeat runs of
// the same test: the persisted `messages` row held the edited text on one run and the pre-edit text on
// the next, while the pending task was queued both times. Two writers, last write wins, no ordering
// guarantee between them.
//
// That window does not exist in production — the channel is queried and persisted before any message UI
// exists to edit, so a user cannot reach it. Only code editing from a child mount effect can, which is
// exactly what this harness does.
//
// It used to be hidden. While `doUpdateMessageRequest` was a prop, the callback polled `configState`
// until `Channel`'s effect had registered the handler; the first iteration found nothing and yielded a
// macrotask, which is what let the parent effects flush. Registering the handler declaratively removed
// the reason to poll and, accidentally, the barrier. So it is now explicit and named for what it does:
// one macrotask, matching the single yield the poll performed, not a sleep tuned until tests went green.
const flushMountEffects = () => new Promise((resolve) => setTimeout(resolve, 0));

test('Workaround to allow exporting tests', () => expect(true).toBe(true));

export const OptimisticUpdates = () => {
  describe('Optimistic Updates', () => {
    let chatClient: StreamChat;

    const getRandomInt = (lower: number, upper: number) =>
      Math.floor(lower + Math.random() * (upper - lower + 1));
    const createChannel = () => {
      const allUsers = Array(20).fill(1).map(generateUser);
      const allMessages: LocalMessage[] = [];
      const allMembers: ChannelMemberResponse[] = [];
      const allReactions: ReactionResponse[] = [];
      const allReads: Array<{
        /** Unix nanoseconds, as the API sends it. */
        last_read: number;
        unread_messages: number;
        user: ReturnType<typeof generateUser> | undefined;
      }> = [];
      const id = uuidv4();
      const cid = `messaging:${id}`;
      const begin = getRandomInt(0, allUsers.length - 2); // begin shouldn't be the end of users.length
      const end = getRandomInt(begin + 1, allUsers.length - 1);
      const usersForMembers = allUsers.slice(begin, end);
      const members = usersForMembers.map((user: UserResponse) =>
        generateMember({
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
          const reactions = usersForReactions.map((user: UserResponse) =>
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
            user_id: user.id,
          });
        });

      const reads = members.map((member: ChannelMemberResponse) => ({
        last_read: dateToNs(
          new Date(new Date().setDate(new Date().getDate() - getRandomInt(0, 20))),
        ),
        unread_messages: getRandomInt(0, messages.length),
        user: member.user,
      }));

      allMessages.push(...messages);
      allMembers.push(...members);
      allReads.push(...reads);

      // `cid` is not part of `GeneratedChannelResponseCustomValues`, but tests rely on reading it
      // back as a top-level field on the generated channel response — keep the runtime shape and
      // widen the input type.
      return generateChannelResponse({
        cid,
        id,
        members,
        messages,
      } as unknown as Parameters<typeof generateChannelResponse>[0]) as ReturnType<
        typeof generateChannelResponse
      > & { cid: string; id: string };
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
        channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
        isLatestMessagesSet: true,
      });
      chatClient.wsConnection = {
        isHealthy: true,
        onlineStatusChanged: jest.fn(),
      } as unknown as StreamChat['wsConnection'];
    });

    afterEach(() => {
      BetterSqlite.dropAllTables();
      BetterSqlite.closeDB();
      cleanup();
      jest.clearAllMocks();
    });

    let channel: ChannelLLC;
    // This component is used for performing effects in a component that consumes ChannelContext,
    // i.e. making use of the callbacks & values provided by the Channel component.
    // the effect is called every time channelContext changes
    const CallbackEffectWithContext = <T,>({
      callback,
      children,
      context,
    }: {
      callback: (ctx: T) => Promise<void> | void;
      children: React.ReactNode;
      context: React.Context<T>;
    }) => {
      const ctx = useContext(context);
      const [ready, setReady] = useState(false);
      // Run the callback exactly once. The context value is a fresh object on every render, so keying
      // the effect on it would re-fire the callback after `setReady` re-renders — double-invoking the
      // operation under test and, e.g., queuing a pending task twice. A ref guard pins it to mount.
      const hasRun = useRef(false);
      useEffect(() => {
        if (hasRun.current) {
          return;
        }
        hasRun.current = true;
        const call = async () => {
          await callback(ctx);
          setReady(true);
        };

        call();
      }, [callback, ctx]);

      if (!ready) {
        return null;
      }

      return <>{children}</>;
    };

    // Same as CallbackEffectWithContext, but sources the message operations (delete/react/etc.)
    // from the useMessageOperations hook instead of a context — they no longer live on MessagesContext.
    const CallbackEffectWithMessageOperations = ({
      callback,
      children,
    }: {
      callback: (ops: MessageOperations) => Promise<void> | void;
      children: React.ReactNode;
    }) => {
      const ops = useMessageOperations();
      const [ready, setReady] = useState(false);
      // Run the callback exactly once. `useMessageOperations` returns a fresh object on every render,
      // so keying the effect on it would re-fire the callback after `setReady` re-renders —
      // double-invoking the operation under test (queuing a pending task twice). A ref guard pins it
      // to mount.
      const hasRun = useRef(false);
      useEffect(() => {
        if (hasRun.current) {
          return;
        }
        hasRun.current = true;
        const call = async () => {
          await callback(ops);
          setReady(true);
        };

        call();
      }, [callback, ops]);

      if (!ready) {
        return null;
      }

      return <>{children}</>;
    };

    describe('delete message', () => {
      // Queuing triggers on an EPHEMERAL failure — a connection-loss/offline error or a retryable
      // server code (see the LLC's `queueTask` + `isEphemeral`/`shouldSkipQueueingTask`). A definitive
      // server rejection (e.g. a plain 500 with no retryable code) is intentionally NOT queued, since
      // retrying it would never succeed. Force the ephemeral case with an offline connection so the
      // pending task is persisted for replay.
      it('pending task should exist if deleteMessage request fails', async () => {
        const message = generateMessage();

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteMessage }) => {
                  markConnectionUnhealthy(chatClient);
                  useMockedApis(chatClient, [erroredDeleteApi()]);
                  try {
                    await deleteMessage(message);
                  } catch (e) {
                    // do nothing
                  }
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse((pendingTasksRows?.[0]?.payload as string) || '{}');
          expect(pendingTaskType).toBe('delete-message');
          expect(pendingTaskPayload[0].id).toBe(message.id);
        });
      });

      it('pending task should be cleared if deleteMessage request is successful', async () => {
        const message = generateMessage();
        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteMessage }) => {
                  useMockedApis(chatClient, [deleteMessageApi(message)]);
                  await deleteMessage(message);
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
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
      // Queues on an EPHEMERAL failure (offline/connection-loss or a retryable code); a definitive 500
      // is intentionally NOT queued. Force the offline case. See the delete-message variant for detail.
      it('pending task should exist if sendReaction request fails', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.messagePaginator.headItems[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithMessageOperations
                callback={async ({ sendReaction }) => {
                  markConnectionUnhealthy(chatClient);
                  useMockedApis(chatClient, [erroredPostApi()]);
                  try {
                    await sendReaction(reaction.type, targetMessage.id);
                  } catch (e) {
                    // do nothing
                  }
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse((pendingTasksRows?.[0]?.payload as string) || '{}');
          expect(pendingTaskType).toBe('send-reaction');
          expect(pendingTaskPayload[0].id).toBe(targetMessage.id);
        });
      });

      it('pending task should be cleared if sendReaction request is successful', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.messagePaginator.headItems[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithMessageOperations
                callback={async ({ sendReaction }) => {
                  useMockedApis(chatClient, [sendReactionApi(targetMessage, reaction)]);
                  await sendReaction(reaction.type, targetMessage.id);
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
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
      // Queues on an EPHEMERAL failure (offline/connection-loss or a retryable code); a definitive 500
      // is intentionally NOT queued. Force the offline case. See the delete-message variant for detail.
      it('pending task should exist if sendMessage request fails', async () => {
        const newMessage = generateMessage();

        jest.spyOn(channel.messageComposer, 'compose').mockResolvedValue({
          localMessage: newMessage,
          message: newMessage,
          options: {},
        } as unknown as Awaited<ReturnType<typeof channel.messageComposer.compose>>);

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  markConnectionUnhealthy(chatClient);
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
          const pendingTaskPayload = JSON.parse((pendingTasksRows?.[0]?.payload as string) || '{}');
          expect(pendingTaskType).toBe('send-message');
          expect(pendingTaskPayload[0].message.id).toEqual(newMessage.id);
          expect(pendingTaskPayload[0].message.text).toEqual(newMessage.text);
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
                  await sendMessage();
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
      // Queues on an EPHEMERAL failure (offline/connection-loss or a retryable code); a definitive 500
      // is intentionally NOT queued. Force the offline case. See the delete-message variant for detail.
      it('pending task should exist if deleteReaction request fails', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.messagePaginator.headItems[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteReaction }) => {
                  markConnectionUnhealthy(chatClient);
                  useMockedApis(chatClient, [erroredDeleteApi()]);
                  try {
                    await deleteReaction(reaction.type, targetMessage.id);
                  } catch (e) {
                    // do nothing
                  }
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());
        await waitFor(async () => {
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const pendingTaskType = pendingTasksRows?.[0]?.type;
          const pendingTaskPayload = JSON.parse((pendingTasksRows?.[0]?.payload as string) || '{}');
          expect(pendingTaskType).toBe('delete-reaction');
          expect(pendingTaskPayload[0].id).toBe(targetMessage.id);
        });
      });

      it('pending task should be cleared if deleteReaction request is successful', async () => {
        const reaction = generateReaction();
        const targetMessage = channel.messagePaginator.headItems[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteReaction }) => {
                  useMockedApis(chatClient, [deleteReactionApi(targetMessage, reaction)]);
                  await deleteReaction(reaction.type, targetMessage.id);
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
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

    describe('edit message', () => {
      it('should keep the optimistic edit in state and DB if the LLC queues the edit', async () => {
        const message = channel.messagePaginator.headItems[0];
        const editedText = 'edited while offline';

        // Registered declaratively — the `<Channel doUpdateMessageRequest>` prop is gone. The LLC
        // resolves this into `channel.configState.requestHandlers` as part of the channel's own
        // derivation, so it is in place before `render` rather than after a mount effect.
        chatClient.config.set({
          channel: {
            requestHandlers: {
              updateMessageRequest: (async ({
                localMessage,
                options,
              }: {
                localMessage: LocalMessage;
                options?: unknown;
              }) => {
                // The LLC hands over a `localMessage`; the prop received the `updateMessage` request
                // shape `{ id, message }`. Rebuilt so the queued pending-task payload is unchanged.
                const updatedMessage = {
                  id: localMessage.id,
                  message: localMessageToNewMessagePayload(localMessage),
                };
                const editedMessage = {
                  ...message,
                  message_text_updated_at: nowNs(),
                  text: editedText,
                  updated_at: nowNs(),
                };
                await getOfflineDb(chatClient).addPendingTask({
                  channelId: channel.id,
                  channelType: channel.type,
                  messageId: message.id,
                  payload: [updatedMessage, options],
                  type: 'update-message',
                });
                // A complete offline update handler persists the optimistic edit to the DB (so it
                // survives cold start and the offline-DB hydration that Channel triggers on mount /
                // sync-status change re-seeds the edited copy, not the pre-edit one).
                await getOfflineDb(chatClient).upsertMessages({
                  execute: true,
                  messages: [editedMessage],
                });
                return { message: editedMessage };
              }) as never,
            },
          },
        });

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel
              channel={channel}
              // v10 invokes doUpdateMessageRequest with the `updateMessage` request shape
              // `{ id, message }` (see useChannelRequestHandlers), not a flat LocalMessage. Echo a
              // server-shaped response reflecting the edit; the LLC's success path re-ingests it.
            >
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  await flushMountEffects();
                  await editMessage({
                    localMessage: {
                      ...message,
                      cid: channel.cid,
                      text: editedText,
                    },
                    options: {},
                  });
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
          const updatedMessage = channel.messagePaginator.getItem(message.id);
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const dbMessages = await BetterSqlite.selectFromTable('messages');
          const dbMessage = dbMessages.find((row) => row.id === message.id);

          expect(updatedMessage!.text).toBe(editedText);
          expect(updatedMessage!.message_text_updated_at).toBeTruthy();
          expect(pendingTasksRows).toHaveLength(1);
          expect(pendingTasksRows[0].type).toBe('update-message');
          expect(dbMessage!.text).toBe(editedText);
          expect(dbMessage!.messageTextUpdatedAt).toBeTruthy();
        });
      });

      it('should keep the optimistic edit if the request fails', async () => {
        const message = channel.messagePaginator.headItems[0];
        const editedText = 'should stay optimistic';

        // Registered declaratively — the `<Channel doUpdateMessageRequest>` prop is gone. The LLC
        // resolves this into `channel.configState.requestHandlers` as part of the channel's own
        // derivation, so it is in place before `render` rather than after a mount effect.
        chatClient.config.set({
          channel: {
            requestHandlers: {
              updateMessageRequest: (async () => {
                await getOfflineDb(chatClient).upsertMessages({
                  execute: true,
                  messages: [{ ...message, status: MessageStatusTypes.FAILED, text: editedText }],
                });
                throw new Error('validation');
              }) as never,
            },
          },
        });

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel
              channel={channel}
              // Persist the optimistic edit locally, then reject the request (validation failure).
              // The local copy (state + DB) must survive so the user's edit is not lost, and so the
              // offline-DB hydration Channel runs on mount re-seeds the edited copy, not the pre-edit
              // one.
            >
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  await flushMountEffects();
                  try {
                    await editMessage({
                      localMessage: {
                        ...message,
                        cid: channel.cid,
                        text: editedText,
                      },
                      options: {},
                    });
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
          const updatedMessage = channel.messagePaginator.getItem(message.id);
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const dbMessages = await BetterSqlite.selectFromTable('messages');
          const dbMessage = dbMessages.find((row) => row.id === message.id);

          expect(updatedMessage!.text).toBe(editedText);
          expect(pendingTasksRows).toHaveLength(0);
          expect(dbMessage!.text).toBe(editedText);
        });
      });

      it('should not set message_text_updated_at during optimistic edit of a failed message', async () => {
        // A message that failed to send never received a server-confirmed text update, so a realistic
        // failed message carries no message_text_updated_at. generateMessage always sets one, so strip
        // it here; the test then verifies the optimistic edit path does not add one back.
        const { message_text_updated_at: _stripped, ...headItem } = channel.messagePaginator
          .headItems[0] as LocalMessage & { message_text_updated_at?: Date };
        const message = headItem as LocalMessage;
        const optimisticStateSpy = jest.fn();

        // Registered declaratively — the `<Channel doUpdateMessageRequest>` prop is gone. The LLC
        // resolves this into `channel.configState.requestHandlers` as part of the channel's own
        // derivation, so it is in place before `render` rather than after a mount effect.
        chatClient.config.set({
          channel: {
            requestHandlers: {
              updateMessageRequest: (() => {
                const optimisticMessage = channel.messagePaginator.getItem(message.id);
                optimisticStateSpy(optimisticMessage);

                return {
                  message: {
                    ...optimisticMessage,
                  },
                };
              }) as never,
            },
          },
        });

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  await flushMountEffects();
                  await editMessage({
                    localMessage: {
                      ...message,
                      cid: channel.cid,
                      status: MessageStatusTypes.FAILED,
                      text: 'edited failed message',
                    },
                    options: {},
                  });
                }}
                context={MessageInputContext}
              >
                <View testID='children' />
              </CallbackEffectWithContext>
            </Channel>
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        await waitFor(() => {
          expect(optimisticStateSpy).toHaveBeenCalled();
          expect(optimisticStateSpy.mock.calls[0][0].message_text_updated_at).toBeUndefined();
        });
      });

      it('should keep the optimistic edit for attachment updates without auto-queueing', async () => {
        const message = channel.messagePaginator.headItems[0];
        const editedText = 'edited attachment message';
        const localUri = 'file://edited-attachment.png';
        const editedAttachments = [
          {
            asset_url: localUri,
            custom: {
              originalFile: generateFileReference({
                name: 'edited-attachment.png',
                type: 'image/png',
                uri: localUri,
              }),
            },
            type: 'file',
          },
        ];

        // Registered declaratively — the `<Channel doUpdateMessageRequest>` prop is gone. The LLC
        // resolves this into `channel.configState.requestHandlers` as part of the channel's own
        // derivation, so it is in place before `render` rather than after a mount effect.
        chatClient.config.set({
          channel: {
            requestHandlers: {
              updateMessageRequest: (async () => {
                await getOfflineDb(chatClient).upsertMessages({
                  execute: true,
                  messages: [
                    {
                      ...message,
                      attachments: editedAttachments,
                      status: MessageStatusTypes.FAILED,
                      text: editedText,
                    },
                  ],
                });
                throw new Error('offline');
              }) as never,
            },
          },
        });

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel
              channel={channel}
              // Persist the optimistic attachment edit locally, then reject the request (offline). The
              // local copy (state + DB, incl. the local attachment URL) must survive so the offline-DB
              // hydration Channel runs on mount re-seeds the edited copy, not the pre-edit one.
            >
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  await flushMountEffects();
                  try {
                    await editMessage({
                      localMessage: {
                        ...message,
                        attachments: editedAttachments,
                        cid: channel.cid,
                        text: editedText,
                      },
                      options: {},
                    });
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
          const updatedMessage = channel.messagePaginator.getItem(message.id);
          const pendingTasksRows = await BetterSqlite.selectFromTable('pendingTasks');
          const dbMessages = await BetterSqlite.selectFromTable('messages');
          const dbMessage = dbMessages.find((row) => row.id === message.id);
          const storedAttachments = JSON.parse(dbMessage!.attachments as string);

          expect(updatedMessage!.text).toBe(editedText);
          expect(updatedMessage!.attachments![0].asset_url).toBe(localUri);
          expect(pendingTasksRows).toHaveLength(0);
          expect(dbMessage!.text).toBe(editedText);
          expect(storedAttachments[0].asset_url).toBe(localUri);
        });
      });
    });

    // INTENTIONALLY RED — DO NOT SKIP OR WORK AROUND. Every passing "edit message" test above supplies
    // a custom `doUpdateMessageRequest` that manually persists + queues the edit. These two tests use
    // NO custom handler — they exercise the DEFAULT offline update/delete path, which is not yet
    // implemented in v10: the pending task queues + replays (see "pending task execution" below), but
    // the optimistic edit/delete is NOT applied to state or persisted to the offline DB. Keep these
    // failing until the default optimistic offline update/delete lands — the red is the signal.
    describe('default offline update/delete (no custom handler)', () => {
      it('should optimistically apply + persist an offline edit without a custom doUpdateMessageRequest', async () => {
        const message = channel.messagePaginator.headItems[0];
        const editedText = 'edited offline via default path';

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  // Same barrier every other "edit message" test uses. Without it the edit fires from
                  // this child mount effect BEFORE `Channel`'s own effect runs `channel.watch()`, whose
                  // seed then re-ingests the pre-edit copy from the mocked query response and overwrites
                  // the optimistic edit. Measured: the optimistic copy is correct at `editMessage`
                  // resolution and still correct a macrotask later, then the in-flight watch lands on
                  // top of it. That window is unreachable in production (see flushMountEffects).
                  await flushMountEffects();
                  // Go offline BEFORE editing so the default (no-handler) offline path runs.
                  markConnectionUnhealthy(chatClient);
                  try {
                    await editMessage({
                      localMessage: { ...message, cid: channel.cid, text: editedText },
                      options: {},
                    });
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

        // A working optimistic offline edit reflects the new text in state AND persists it to the
        // offline DB immediately (so it survives cold start / hydration), independent of the queue.
        await waitFor(
          async () => {
            const updatedMessage = channel.messagePaginator.getItem(message.id);
            const dbMessages = await BetterSqlite.selectFromTable('messages');
            const dbMessage = dbMessages.find((row) => row.id === message.id);

            expect(updatedMessage?.text).toBe(editedText);
            // Offline support is enabled and the edit was queued for replay, so this is "pending",
            // not "failed" — the message must never enter a failed state on this path.
            expect(updatedMessage?.status).not.toBe(MessageStatusTypes.FAILED);
            expect(dbMessage?.text).toBe(editedText);
          },
          { timeout: 2500 },
        );
      });

      it('should optimistically apply + persist an offline delete without a custom doDeleteMessageRequest', async () => {
        const message = channel.messagePaginator.headItems[0];

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteMessage }) => {
                  await flushMountEffects();
                  markConnectionUnhealthy(chatClient);
                  try {
                    await deleteMessage(message);
                  } catch (e) {
                    // do nothing
                  }
                }}
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
            </Channel>
          </Chat>,
        );
        await waitFor(() => expect(screen.getByTestId('children')).toBeTruthy());

        // A working optimistic offline delete marks the message deleted in state AND persists that to
        // the offline DB immediately (independent of the queued delete-message task that replays later).
        await waitFor(
          async () => {
            const stateMessage = channel.messagePaginator.getItem(message.id);
            const dbMessages = await BetterSqlite.selectFromTable('messages');
            const dbMessage = dbMessages.find((row) => row.id === message.id);

            expect(stateMessage?.type).toBe('deleted');
            expect(dbMessage?.type).toBe('deleted');
          },
          { timeout: 2500 },
        );
      });
    });

    describe('failed message persistence', () => {
      it('persists a failed send so it survives a restart and reads back as retryable', async () => {
        const localMessage = generateMessage({
          cid: channel.cid,
          status: MessageStatusTypes.SENDING,
          text: 'unsent across a restart',
          user: chatClient.user as UserResponse,
          user_id: chatClient.userID,
        });

        jest
          .spyOn(channel.messageComposer, 'compose')
          .mockResolvedValue({ localMessage, message: localMessage } as unknown as Awaited<
            ReturnType<typeof channel.messageComposer.compose>
          >);

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={localMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  await flushMountEffects();
                  markConnectionUnhealthy(chatClient);
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

        // The row itself is what makes a failed message survive a process death: v9 wrote it ahead of
        // the request and v10 dropped that write, which is why closing the app lost unsent messages.
        await waitFor(async () => {
          const dbMessages = await BetterSqlite.selectFromTable<{
            extraData: string;
            id: string;
            text: string;
          }>('messages');
          const dbMessage = dbMessages.find((row) => row.id === localMessage.id);

          expect(dbMessage).toBeTruthy();
          expect(dbMessage!.text).toBe(localMessage.text);
          // `status` has no column of its own — it round-trips through the extraData blob.
          expect(JSON.parse(dbMessage!.extraData).status).toBe(MessageStatusTypes.FAILED);
        });

        // And it has to come back through the DB's own read path, which is what a cold start hydrates
        // from and what `Channel.reload` consults on reconnect.
        const restored = await (
          chatClient.offlineDb as unknown as {
            getFailedMessages: (o: { cid: string }) => Promise<LocalMessage[]>;
          }
        ).getFailedMessages({ cid: channel.cid });

        expect(restored.map((message) => message.id)).toContain(localMessage.id);
        expect(restored.find((message) => message.id === localMessage.id)?.text).toBe(
          localMessage.text,
        );
      });
    });

    describe('channel guard cost', () => {
      it('writes an optimistic message without probing for the channel row', async () => {
        const localMessage = generateMessage({
          cid: channel.cid,
          status: MessageStatusTypes.SENDING,
          text: 'no guard probe please',
          user: chatClient.user as UserResponse,
          user_id: chatClient.userID,
        });

        jest
          .spyOn(channel.messageComposer, 'compose')
          .mockResolvedValue({ localMessage, message: localMessage } as unknown as Awaited<
            ReturnType<typeof channel.messageComposer.compose>
          >);

        let guardSpy: jest.SpyInstance | undefined;

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={localMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  await flushMountEffects();
                  // Spied after mount, so the count covers only the send below — not the channel
                  // query that `Channel` performs while starting up.
                  guardSpy = jest.spyOn(
                    chatClient.offlineDb as unknown as { channelExists: () => Promise<boolean> },
                    'channelExists',
                  );
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

        // The write has to actually have happened, or "no probe" would be trivially true.
        await waitFor(async () => {
          const dbMessages = await BetterSqlite.selectFromTable<{ id: string }>('messages');
          expect(dbMessages.some((row) => row.id === localMessage.id)).toBe(true);
        });

        // The guard is lazy: it attempts the write and only probes if that fails on the foreign key.
        // A probe here means the eager version is back — a native round-trip per message write, for
        // every message written AND every message received.
        expect(guardSpy).not.toHaveBeenCalled();
      });
    });

    describe('optimistic edit without offline support', () => {
      it('keeps the optimistic edit AND surfaces the failure when there is no offline DB', async () => {
        const message = channel.messagePaginator.headItems[0];
        const editedText = 'edited with no offline support';

        chatClient.config.set({
          channel: {
            requestHandlers: {
              updateMessageRequest: (() => Promise.reject(new Error('validation'))) as never,
            },
          },
        });

        // No `enableOfflineSupport`, so `client.offlineDb` is never attached and there is no queue for
        // the edit to fall back on. The failure is therefore definitive and must be shown on the
        // message — the opposite of the offline-enabled case above, where it must NOT be.
        render(
          <Chat client={chatClient}>
            <Channel channel={channel}>
              <CallbackEffectWithContext
                callback={async ({ editMessage }) => {
                  await flushMountEffects();
                  try {
                    await editMessage({
                      localMessage: { ...message, cid: channel.cid, text: editedText },
                      options: {},
                    });
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

        await waitFor(() => {
          const updatedMessage = channel.messagePaginator.getItem(message.id);

          expect(chatClient.offlineDb).toBeUndefined();
          // The edit is never rolled back — reverting would throw away what the user typed.
          expect(updatedMessage?.text).toBe(editedText);
          expect(updatedMessage?.status).toBe(MessageStatusTypes.FAILED);
        });
      });
    });

    describe('pending task execution', () => {
      it('pending task should be executed after connection is recovered', async () => {
        const message = channel.messagePaginator.headItems[0];
        const reaction = generateReaction();

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={message.text}>
              <CallbackEffectWithMessageOperations
                callback={async ({ deleteMessage, sendReaction }) => {
                  // Queue two pending tasks via the working offline path (helper), then reconnect below.
                  markConnectionUnhealthy(chatClient);
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
              >
                <View testID='children' />
              </CallbackEffectWithMessageOperations>
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
        } as unknown as Awaited<ReturnType<typeof channel.messageComposer.compose>>);

        // initialValue is needed as a prop to trick the message input ctx into thinking
        // we are sending a message.
        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={newMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  // Queue a pending send task via the working offline path (helper), then reconnect below.
                  markConnectionUnhealthy(chatClient);
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

      it('should not re-add a failed local message after reconnect when its pending send task was resolved', async () => {
        const localMessage = generateMessage({
          // The channel paginator only ingests messages whose cid matches (matchesFilter), so the
          // optimistic message must carry the channel cid to appear in the paginator/headItems.
          cid: channel.cid,
          status: MessageStatusTypes.SENDING,
          text: 'offline resend',
          user: chatClient.user as UserResponse,
          user_id: chatClient.userID,
        });
        const serverMessage = generateMessage({
          cid: channel.cid,
          id: localMessage.id,
          text: localMessage.text,
          user: chatClient.user as UserResponse,
          user_id: chatClient.userID,
        });

        jest
          .spyOn(channel.messageComposer, 'compose')
          .mockResolvedValue({ localMessage, message: localMessage } as unknown as Awaited<
            ReturnType<typeof channel.messageComposer.compose>
          >);

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={localMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  // Offline + no POST mock: the offline queueTask persists the pending task, then the
                  // LLC's fallthrough send request rejects (no mocked response), so the message settles
                  // as `failed` and is kept in the paginator — the precondition this test resyncs from.
                  markConnectionUnhealthy(chatClient);
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

        let pendingTask: TestPendingTask | undefined;
        await waitFor(async () => {
          const pendingTasks = await getOfflineDb(chatClient).getPendingTasks();
          expect(pendingTasks).toHaveLength(1);
          pendingTask = pendingTasks[0];
        });

        expect(
          channel.messagePaginator.headItems.some((message) => message.id === localMessage.id),
        ).toBe(true);

        jest
          .spyOn(channel, 'watch')
          .mockResolvedValue({} as Awaited<ReturnType<typeof channel.watch>>);
        // Without this the reconnect below nukes the offline DB. `client.sync` is a POST, so it
        // resolves with the `getOrCreateChannelApi` payload mocked in `beforeEach`, whose `events` is
        // undefined; `OfflineDBSyncManager.sync` then throws reading `result.events.length` and its
        // catch block calls `resetDB()` — taking the persisted failed message with it. Nothing to do
        // with what these tests assert, so give sync an empty, well-formed reply.
        jest
          .spyOn(chatClient, 'sync')
          .mockResolvedValue({ events: [] } as unknown as Awaited<
            ReturnType<typeof chatClient.sync>
          >);

        channel.messagePaginator.removeItem({ id: localMessage.id });
        channel.messagePaginator.ingestItem(channel.state.formatMessage(serverMessage));
        await getOfflineDb(chatClient).deletePendingTask({ id: pendingTask!.id });

        await act(async () => {
          // The real reconnect signal. `invokeSyncStatusListeners(true)` on its own used to be enough
          // because `Channel` subscribed to the offline DB's sync-status edge itself; on v10 that moved
          // into the LLC's `ConnectionRecoveryManager`, which binds that subscription lazily from its
          // `connection.changed` handler and only then reloads the active channels. Driving the edge
          // directly therefore reached no subscriber at all — the assertions below never ran against a
          // reload. `OfflineDBSyncManager` publishes the edge itself once it has replayed and synced.
          markConnectionHealthy(chatClient);
          dispatchConnectionChangedEvent(chatClient, true);
          // Recovery is detached (`runDetached`), so yield once to let it start before the assertions
          // below begin polling.
          await flushMountEffects();
        });

        await waitFor(() => {
          const matchingMessages = channel.messagePaginator.headItems.filter(
            (message) => message.text === localMessage.text,
          );

          expect(matchingMessages).toHaveLength(1);
          expect(matchingMessages[0].id).toBe(serverMessage.id);
          expect(matchingMessages[0].status).not.toBe(MessageStatusTypes.FAILED);
        });
      });

      // INTENTIONALLY RED — DO NOT SKIP OR WORK AROUND. This tests the OPTIMISTIC-UPDATE layer:
      // a failed local message must be persisted to the offline DB and re-added on reconnect when the
      // fresh server state does not contain it. In v10 the failed optimistic message is NOT persisted
      // (`dbHasFailedMsg === false`), so it never comes back. Pending-task QUEUING works; optimistic
      // failed-message persistence/re-add does not. Keep this failing until that is implemented — the
      // red is the signal.
      it('should re-add a failed local message after reconnect when fresh state still does not contain it', async () => {
        const localMessage = generateMessage({
          // The channel paginator only ingests messages whose cid matches (matchesFilter), so the
          // optimistic message must carry the channel cid to appear in the paginator/headItems.
          cid: channel.cid,
          status: MessageStatusTypes.SENDING,
          text: 'offline resend unresolved',
          user: chatClient.user as UserResponse,
          user_id: chatClient.userID,
        });

        jest
          .spyOn(channel.messageComposer, 'compose')
          .mockResolvedValue({ localMessage, message: localMessage } as unknown as Awaited<
            ReturnType<typeof channel.messageComposer.compose>
          >);

        render(
          <Chat client={chatClient} enableOfflineSupport>
            <Channel channel={channel} initialValue={localMessage.text}>
              <CallbackEffectWithContext
                callback={async ({ sendMessage }) => {
                  // Offline + no POST mock: the offline queueTask persists the pending task, then the
                  // LLC's fallthrough send request rejects (no mocked response), so the message settles
                  // as `failed` and is kept in the paginator — the precondition this test resyncs from.
                  markConnectionUnhealthy(chatClient);
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

        let pendingTask: TestPendingTask | undefined;
        await waitFor(async () => {
          const pendingTasks = await getOfflineDb(chatClient).getPendingTasks();
          expect(pendingTasks).toHaveLength(1);
          pendingTask = pendingTasks[0];
        });

        jest
          .spyOn(channel, 'watch')
          .mockResolvedValue({} as Awaited<ReturnType<typeof channel.watch>>);
        // Without this the reconnect below nukes the offline DB. `client.sync` is a POST, so it
        // resolves with the `getOrCreateChannelApi` payload mocked in `beforeEach`, whose `events` is
        // undefined; `OfflineDBSyncManager.sync` then throws reading `result.events.length` and its
        // catch block calls `resetDB()` — taking the persisted failed message with it. Nothing to do
        // with what these tests assert, so give sync an empty, well-formed reply.
        jest
          .spyOn(chatClient, 'sync')
          .mockResolvedValue({ events: [] } as unknown as Awaited<
            ReturnType<typeof chatClient.sync>
          >);

        channel.messagePaginator.removeItem({ id: localMessage.id });
        await getOfflineDb(chatClient).deletePendingTask({ id: pendingTask!.id });

        await act(async () => {
          // The real reconnect signal. `invokeSyncStatusListeners(true)` on its own used to be enough
          // because `Channel` subscribed to the offline DB's sync-status edge itself; on v10 that moved
          // into the LLC's `ConnectionRecoveryManager`, which binds that subscription lazily from its
          // `connection.changed` handler and only then reloads the active channels. Driving the edge
          // directly therefore reached no subscriber at all — the assertions below never ran against a
          // reload. `OfflineDBSyncManager` publishes the edge itself once it has replayed and synced.
          markConnectionHealthy(chatClient);
          dispatchConnectionChangedEvent(chatClient, true);
          // Recovery is detached (`runDetached`), so yield once to let it start before the assertions
          // below begin polling.
          await flushMountEffects();
        });

        await waitFor(() => {
          const matchingMessages = channel.messagePaginator.headItems.filter(
            (message) => message.id === localMessage.id,
          );

          expect(matchingMessages).toHaveLength(1);
          expect(matchingMessages[0].status).toBe(MessageStatusTypes.FAILED);
          expect(matchingMessages[0].text).toBe(localMessage.text);
        });
      });
    });
  });
};
