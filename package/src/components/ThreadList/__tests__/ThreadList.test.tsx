import React from 'react';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';
import { Thread } from 'stream-chat';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { Chat } from '../../Chat/Chat';
import { ThreadList } from '../ThreadList';

// Like stream-chat-react: the skeleton is the first load only, a reload keeps showing the list, and
// the footer is a next page.
describe('ThreadList loading states', () => {
  let chatClient: StreamChat;
  let channel: ChannelType;

  const makeThread = () =>
    new Thread({
      channel,
      client: chatClient,
      parentMessage: generateMessage({ cid: channel.cid, text: 'Parent' }),
    });

  /** A `queryThreadsAndHydrate` response that lands only when the test says so. */
  const respondLater = () => {
    let settle: (threads: Thread[], next?: string) => void = () => undefined;
    jest.spyOn(chatClient, 'queryThreadsAndHydrate').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          settle = (threads, next) => resolve({ next, threads });
        }),
    );
    return (threads: Thread[], next?: string) => act(() => settle(threads, next));
  };

  const skeletons = () => screen.queryAllByTestId('channel-preview-skeleton');
  const rows = () => screen.queryAllByTestId('thread-list-item');
  // The footer spinner has no text or accessible role to query, so read what the mapping sets.
  const footer = () => screen.getByTestId('thread-flatlist').props.ListFooterComponent;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    chatClient = client;
    channel = channels[0];
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it('shows the skeleton on the first load, then the list', async () => {
    const settle = respondLater();

    render(
      <Chat client={chatClient}>
        <ThreadList isFocused />
      </Chat>,
    );

    await waitFor(() => expect(skeletons().length).toBeGreaterThan(0));
    await settle([makeThread()]);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(skeletons()).toHaveLength(0);
  });

  it('keeps showing the list, without the skeleton, while a loaded list reloads', async () => {
    jest
      .spyOn(chatClient, 'queryThreadsAndHydrate')
      .mockResolvedValueOnce({ next: undefined, threads: [makeThread()] });
    render(
      <Chat client={chatClient}>
        <ThreadList isFocused />
      </Chat>,
    );
    await waitFor(() => expect(rows()).toHaveLength(1));
    const settle = respondLater();

    act(() => {
      void chatClient.threads.reload({ force: true });
    });

    expect(rows()).toHaveLength(1);
    expect(skeletons()).toHaveLength(0);
    await settle([makeThread(), makeThread()]);
    await waitFor(() => expect(rows()).toHaveLength(2));
  });

  it('shows the footer, not the skeleton, while a next page loads', async () => {
    jest
      .spyOn(chatClient, 'queryThreadsAndHydrate')
      .mockResolvedValueOnce({ next: 'cursor', threads: [makeThread()] });
    // Queued up front: a short list fires `onEndReached` by itself once the first page lands.
    const settle = respondLater();
    render(
      <Chat client={chatClient}>
        <ThreadList isFocused />
      </Chat>,
    );
    await waitFor(() => expect(rows()).toHaveLength(1));

    act(() => {
      void chatClient.threads.paginator.toTail();
    });

    await waitFor(() => expect(footer()).toBeDefined());
    expect(skeletons()).toHaveLength(0);
    expect(rows()).toHaveLength(1);
    await settle([makeThread()]);
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(footer()).toBeUndefined();
  });
  it('pluralizes the unseen-threads banner', async () => {
    jest
      .spyOn(chatClient, 'queryThreadsAndHydrate')
      .mockResolvedValueOnce({ next: undefined, threads: [makeThread()] });
    render(
      <Chat client={chatClient}>
        <ThreadList isFocused />
      </Chat>,
    );
    await waitFor(() => expect(rows()).toHaveLength(1));

    act(() => chatClient.threads.state.partialNext({ unseenThreadIds: ['a'] }));
    await waitFor(() => expect(screen.getByText('1 new thread')).toBeTruthy());
    act(() => chatClient.threads.state.partialNext({ unseenThreadIds: ['a', 'b'] }));
    await waitFor(() => expect(screen.getByText('2 new threads')).toBeTruthy());
  });
});
