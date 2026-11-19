import React from 'react';
import { Text, View } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageFlashList } from '../MessageFlashList';

type ViewableItemsChanged = (info: {
  viewableItems: { index: number; isViewable: boolean; item: LocalMessage; key: string }[];
}) => void;

const mockFlashList: {
  containerHeight: number;
  onViewableItemsChanged?: ViewableItemsChanged;
  scrollToEnd: jest.Mock;
  windowHeight: number;
} = { containerHeight: 0, scrollToEnd: jest.fn(), windowHeight: 700 };

// Renders nothing but captures the viewability callback; the two sizes drive the "content fits" check,
// `scrollToEnd` is recorded and every other ref method is a no-op.
jest.mock('@shopify/flash-list', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    FlashList: ReactModule.forwardRef(
      (
        props: { onViewableItemsChanged: ViewableItemsChanged; testID?: string },
        ref: React.Ref<unknown>,
      ) => {
        ReactModule.useImperativeHandle(
          ref,
          () =>
            new Proxy(
              {
                getChildContainerDimensions: () => ({
                  height: mockFlashList.containerHeight,
                  width: 400,
                }),
                getWindowSize: () => ({ height: mockFlashList.windowHeight, width: 400 }),
                scrollToEnd: (...args: unknown[]) => mockFlashList.scrollToEnd(...args),
              },
              {
                get: (target, key) =>
                  key in target ? target[key as keyof typeof target] : () => undefined,
              },
            ),
        );
        mockFlashList.onViewableItemsChanged = props.onViewableItemsChanged;
        return <MockView testID={props.testID} />;
      },
    ),
  };
});

describe('MessageFlashList sticky date header', () => {
  let chatClient: StreamChat;
  let channel: ChannelType;
  let messages: LocalMessage[];

  beforeEach(async () => {
    ({
      channels: [channel],
      client: chatClient,
    } = await initiateClientWithChannels());
    messages = [generateMessage({ id: 'oldest' }), generateMessage({ id: 'newest' })].map(
      (message) => channel.state.formatMessage(message as never),
    );
    channel.messagePaginator.setItems({
      isFirstPage: true,
      isLastPage: true,
      valueOrFactory: messages,
    });
  });

  const renderList = () =>
    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <WithComponents
            overrides={{
              StickyHeader: ({ date }) => (
                <View testID='sticky-header'>
                  <Text>{date ? 'shown' : 'hidden'}</Text>
                </View>
              ),
            }}
          >
            <Channel channel={channel}>
              <MessageFlashList />
            </Channel>
          </WithComponents>
        </Chat>
      </OverlayProvider>,
    );

  // FlashList reports only the newest message on short content: it keeps the offset of its initial
  // scroll, which puts the oldest one above the window.
  const reportOnlyNewestViewable = () =>
    act(() => {
      mockFlashList.onViewableItemsChanged?.({
        viewableItems: [{ index: 1, isViewable: true, item: messages[1], key: 'newest' }],
      });
    });

  it('stays hidden when every message fits on screen', async () => {
    mockFlashList.containerHeight = 200;
    renderList();
    await waitFor(() => expect(mockFlashList.onViewableItemsChanged).toBeDefined());
    expect(channel.messagePaginator.hasMoreTail).toBe(false);

    reportOnlyNewestViewable();

    expect(screen.getByText('hidden', { includeHiddenElements: true })).toBeTruthy();
  });

  it('shows the date of the topmost message when the content scrolls', async () => {
    mockFlashList.containerHeight = 2000;
    renderList();
    await waitFor(() => expect(mockFlashList.onViewableItemsChanged).toBeDefined());

    reportOnlyNewestViewable();

    expect(screen.getByText('shown', { includeHiddenElements: true })).toBeTruthy();
  });
});

// The latest set replaces an older, disconnected window rather than extending it, so the list keeps
// the offset it had there unless it scrolls to the end once the latest set renders.
describe('MessageFlashList scroll to bottom button', () => {
  it('scrolls to the end once it swapped in the latest set', async () => {
    const {
      channels: [channel],
      client: chatClient,
    } = await initiateClientWithChannels();
    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageFlashList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const toMessages = (prefix: string) =>
      Array.from({ length: 10 }, (_, i) =>
        channel.state.formatMessage(generateMessage({ id: `${prefix}-${i}` }) as never),
      );
    // Jumped away after the channel opened, e.g. to a quoted message in an older set.
    act(() =>
      channel.messagePaginator.state.partialNext({ hasMoreHead: true, items: toMessages('older') }),
    );
    jest.spyOn(channel.messagePaginator, 'jumpToTheLatestMessage').mockImplementation(() => {
      channel.messagePaginator.state.partialNext({
        hasMoreHead: false,
        items: toMessages('latest'),
      });
      return Promise.resolve(true);
    });
    await screen.findByTestId('scroll-to-bottom-button');
    mockFlashList.scrollToEnd.mockClear();

    fireEvent.press(screen.getByTestId('scroll-to-bottom-button'));

    await waitFor(() =>
      expect(mockFlashList.scrollToEnd).toHaveBeenCalledWith({ animated: false }),
    );
  });
});
