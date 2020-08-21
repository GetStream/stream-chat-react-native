/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable jest/no-commented-out-tests */
import React from 'react';
import { Text, View } from 'react-native';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import { v4 as uuidv4 } from 'uuid';

import ChannelList from '../ChannelList';
import { Chat } from '../../Chat';
import { ChatContext } from '../../../context';
import {
  dispatchChannelDeletedEvent,
  dispatchChannelTruncatedEvent,
  dispatchChannelUpdatedEvent,
  dispatchConnectionRecoveredEvent,
  dispatchMessageNewEvent,
  dispatchNotificationAddedToChannelEvent,
  dispatchNotificationMessageNewEvent,
  dispatchNotificationRemovedFromChannel,
  erroredGetApi,
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  queryChannelsApi,
  useMockedApis,
} from '../../../mock-builders';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({
  channel,
  channelUpdateCount,
  // latestMessage,
  setActiveChannel,
}) => {
  // console.log('channel text', channel.state.messages[0]?.text);
  return (
    <View
      accessibilityRole='list-item'
      onPress={setActiveChannel}
      testID={channel.id}
    >
      <Text testID='channel-update-count'>{channelUpdateCount}</Text>
      <Text>{channel.data.name}</Text>
      <Text>{channel.state.messages[0]?.text}</Text>
      {/* <Text>{latestMessage}</Text> */}
    </View>
  );
};

const ChannelListComponent = (props) => {
  const { channels, onSelect } = props;
  return (
    <View testID='channel-list'>
      {channels.map((channel) => {
        // console.log('ChannelListComponent -> channel', channel.text);
        return (
          <ChannelPreviewComponent
            channel={channel}
            key={channel.id}
            latestMessage={channel?.text}
            setActiveChannel={onSelect}
          />
        );
      })}
    </View>
  );
};

const ROLE_LIST_ITEM_SELECTOR = '[role="list-item"]';

describe('ChannelList', () => {
  let chatClient;
  let testChannel1;
  let testChannel2;
  let testChannel3;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'uthred' });
    testChannel1 = generateChannel();
    testChannel2 = generateChannel();
    testChannel3 = generateChannel();
  });

  afterEach(cleanup);

  it('should render a list of channels without crashing', async () => {
    const props = {
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
  });

  it('should render a preview of each channel', async () => {
    const props = {
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() =>
      expect(getByTestId(testChannel1.channel.id)).toBeTruthy(),
    );
  });

  it('should re-query channels when filters change', async () => {
    const props = {
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId, rerender } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('channel-list')).toBeTruthy();
      expect(getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);

    rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={{ dummyFilter: true }} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId(testChannel2.channel.id)).toBeTruthy();
    });
  });

  it('should call `setActiveChannel` on press of a channel in the list', async () => {
    const setActiveChannel = jest.fn();
    const props = {
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
      onSelect: setActiveChannel,
    };

    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId, debug } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    fireEvent.press(getByTestId(testChannel1.channel.id));

    await waitFor(() => {
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event handling', () => {
    describe('message.new', () => {
      const props = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      const sendNewMessageOnChannel3 = () => {
        const newMessage = generateMessage({
          user: generateUser(),
        });
        act(() =>
          dispatchMessageNewEvent(chatClient, newMessage, testChannel3.channel),
        );
        return newMessage;
      };

      beforeEach(() => {
        useMockedApis(chatClient, [
          queryChannelsApi([testChannel1, testChannel2, testChannel3]),
        ]);
      });

      it('should move channel to top of the list', async () => {
        const { getByText, getByTestId, getAllByRole } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByText(newMessage.text)).toBeTruthy();
        });
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        const { getByText, getByTestId, getAllByRole } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} lockChannelOrder={true} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[2]).getByText(newMessage.text)).toBeTruthy();
        });
      });
    });

    //   describe('notification.message_new', () => {
    //     it('should move channel to top of the list by default', async () => {
    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1, testChannel2]),
    //         getOrCreateChannelApi(testChannel3),
    //       ]);

    //       const { getByRole, getByTestId, getAllByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             filters={{}}
    //             Preview={ChannelPreviewComponent}
    //             List={ChannelListComponent}
    //             options={{ state: true, watch: true, presence: true }}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchNotificationMessageNewEvent(
    //           chatClient,
    //           testChannel3.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
    //       });

    //       const items = getAllByRole('listitem');

    //       // Get the closes listitem to the channel that received new message.
    //       const channelPreview = getByTestId(testChannel3.channel.id);
    //       expect(channelPreview.isEqualNode(items[0])).toBe(true);
    //     });

    //     it('should call `onMessageNew` function prop, if provided', async () => {
    //       const onMessageNew = jest.fn();

    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1]),
    //         getOrCreateChannelApi(testChannel2),
    //       ]);

    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             filters={{}}
    //             Preview={ChannelPreviewComponent}
    //             List={ChannelListComponent}
    //             onMessageNew={onMessageNew}
    //             options={{ state: true, watch: true, presence: true }}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchNotificationMessageNewEvent(
    //           chatClient,
    //           testChannel2.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(onMessageNew).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });

    //   describe('notification.added_to_channel', () => {
    //     const channelListProps = {
    //       filters: {},
    //       Preview: ChannelPreviewComponent,
    //       List: ChannelListComponent,
    //       options: { state: true, watch: true, presence: true },
    //     };

    //     beforeEach(async () => {
    //       chatClient = await getTestClientWithUser({ id: 'vishal' });
    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1, testChannel2]),
    //         getOrCreateChannelApi(testChannel3),
    //       ]);
    //     });

    //     it('should move channel to top of the list by default', async () => {
    //       const { getByRole, getByTestId, getAllByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchNotificationAddedToChannelEvent(
    //           chatClient,
    //           testChannel3.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
    //       });

    //       const items = getAllByRole('listitem');

    //       // Get the closes listitem to the channel that received new message.
    //       const channelPreview = getByTestId(testChannel3.channel.id);
    //       expect(channelPreview.isEqualNode(items[0])).toBe(true);
    //     });

    //     it('should call `onAddedToChannel` function prop, if provided', async () => {
    //       const onAddedToChannel = jest.fn();
    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             {...channelListProps}
    //             onAddedToChannel={onAddedToChannel}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       // eslint-disable-next-line sonarjs/no-identical-functions
    //       act(() =>
    //         dispatchNotificationAddedToChannelEvent(
    //           chatClient,
    //           testChannel3.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(onAddedToChannel).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });

    //   describe('notification.removed_from_channel', () => {
    //     const channelListProps = {
    //       filters: {},
    //       Preview: ChannelPreviewComponent,
    //       List: ChannelListComponent,
    //     };

    //     // eslint-disable-next-line sonarjs/no-identical-functions
    //     beforeEach(() => {
    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1, testChannel2, testChannel3]),
    //       ]);
    //     });

    //     it('should remove the channel from list by default', async () => {
    //       const { getByRole, getByTestId } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );
    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });
    //       const nodeToBeRemoved = getByTestId(testChannel3.channel.id);

    //       act(() =>
    //         dispatchNotificationRemovedFromChannel(
    //           chatClient,
    //           testChannel3.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(nodeToBeRemoved).not.toBeInTheDocument();
    //       });
    //     });

    //     it('should call `onRemovedFromChannel` function prop, if provided', async () => {
    //       const onRemovedFromChannel = jest.fn();
    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             {...channelListProps}
    //             onRemovedFromChannel={onRemovedFromChannel}
    //           />
    //         </Chat>,
    //       );
    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });
    //       // eslint-disable-next-line sonarjs/no-identical-functions
    //       act(() =>
    //         dispatchNotificationRemovedFromChannel(
    //           chatClient,
    //           testChannel3.channel,
    //         ),
    //       );

    //       await waitFor(() => {
    //         expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });

    //   describe('channel.updated', () => {
    //     const channelListProps = {
    //       filters: {},
    //       Preview: ChannelPreviewComponent,
    //       List: ChannelListComponent,
    //     };

    //     beforeEach(() => {
    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1, testChannel2]),
    //       ]);
    //     });

    //     it('should update the channel in list, by default', async () => {
    //       const { getByRole, getByText } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       const newChannelName = uuidv4();
    //       act(() =>
    //         dispatchChannelUpdatedEvent(chatClient, {
    //           ...testChannel2.channel,
    //           name: newChannelName,
    //         }),
    //       );

    //       await waitFor(() => {
    //         expect(getByText(newChannelName)).toBeInTheDocument();
    //       });
    //     });

    //     it('should call `onChannelUpdated` function prop, if provided', async () => {
    //       const onChannelUpdated = jest.fn();
    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             {...channelListProps}
    //             onChannelUpdated={onChannelUpdated}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       const newChannelName = uuidv4();
    //       // eslint-disable-next-line sonarjs/no-identical-functions
    //       act(() =>
    //         dispatchChannelUpdatedEvent(chatClient, {
    //           ...testChannel2.channel,
    //           name: newChannelName,
    //         }),
    //       );

    //       await waitFor(() => {
    //         expect(onChannelUpdated).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });

    //   describe('channel.deleted', () => {
    //     const channelListProps = {
    //       filters: {},
    //       Preview: ChannelPreviewComponent,
    //       List: ChannelListComponent,
    //     };

    //     // eslint-disable-next-line sonarjs/no-identical-functions
    //     beforeEach(() => {
    //       useMockedApis(chatClient, [
    //         queryChannelsApi([testChannel1, testChannel2]),
    //       ]);
    //     });

    //     it('should remove channel from list, by default', async () => {
    //       const { getByRole, getByTestId } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       const nodeToBeRemoved = getByTestId(testChannel2.channel.id);
    //       act(() =>
    //         dispatchChannelDeletedEvent(chatClient, testChannel2.channel),
    //       );

    //       await waitFor(() => {
    //         expect(nodeToBeRemoved).not.toBeInTheDocument();
    //       });
    //     });

    //     it('should call `onChannelDeleted` function prop, if provided', async () => {
    //       const onChannelDeleted = jest.fn();
    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             {...channelListProps}
    //             onChannelDeleted={onChannelDeleted}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchChannelDeletedEvent(chatClient, testChannel2.channel),
    //       );

    //       await waitFor(() => {
    //         expect(onChannelDeleted).toHaveBeenCalledTimes(1);
    //       });
    //     });

    //     it('should unset activeChannel if it was deleted', async () => {
    //       const setActiveChannel = jest.fn();
    //       const { getByRole } = render(
    //         <ChatContext.Provider
    //           value={{ client: chatClient, setActiveChannel }}
    //         >
    //           <ChannelList
    //             {...channelListProps}
    //             channel={{ cid: testChannel1.channel.cid }}
    //             setActiveChannel={setActiveChannel}
    //           />
    //         </ChatContext.Provider>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchChannelDeletedEvent(chatClient, testChannel1.channel),
    //       );

    //       await waitFor(() => {
    //         expect(setActiveChannel).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });

    //   describe('connection.recovered', () => {
    //     it('should rerender the list', async () => {
    //       const channel1 = generateChannel();
    //       const channel2 = generateChannel();
    //       const channelListProps = {
    //         filters: {},
    //         Preview: ChannelPreviewComponent,
    //         List: ChannelListComponent,
    //       };

    //       useMockedApis(chatClient, [queryChannelsApi([channel1])]);

    //       const { getByRole, getByTestId } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       const updateCount = parseInt(
    //         getNodeText(getByTestId('channelUpdateCount')),
    //         10,
    //       );

    //       useMockedApis(chatClient, [queryChannelsApi([channel2])]);
    //       act(() => dispatchConnectionRecoveredEvent(chatClient));

    //       await waitFor(() => {
    //         expect(
    //           parseInt(getNodeText(getByTestId('channelUpdateCount')), 10),
    //         ).toBe(updateCount + 1);
    //       });
    //     });
    //   });

    //   describe('channel.truncated', () => {
    //     let channel1;
    //     let user1;
    //     let message1;
    //     let message2;

    //     const channelListProps = {
    //       filters: {},
    //       Preview: ChannelPreviewComponent,
    //       List: ChannelListComponent,
    //     };

    //     beforeEach(() => {
    //       user1 = generateUser();
    //       message1 = generateMessage({ user: user1 });
    //       message2 = generateMessage({ user: user1 });
    //       channel1 = generateChannel({ messages: [message1, message2] });

    //       useMockedApis(chatClient, [queryChannelsApi([channel1])]);
    //     });

    //     it('should remove latest message', async () => {
    //       const { getByRole, getByText } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList {...channelListProps} />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       const latestMessageNode = getByText(message2.text);

    //       act(() =>
    //         dispatchChannelTruncatedEvent(chatClient, channel1.channel),
    //       );

    //       await waitFor(() => {
    //         expect(latestMessageNode).not.toHaveTextContent(message2.text);
    //       });
    //     });

    //     it('should call `onChannelTruncated` function prop, if provided', async () => {
    //       const onChannelTruncated = jest.fn();
    //       const { getByRole } = render(
    //         <Chat client={chatClient}>
    //           <ChannelList
    //             {...channelListProps}
    //             onChannelTruncated={onChannelTruncated}
    //           />
    //         </Chat>,
    //       );

    //       // Wait for list of channels to load in DOM.
    //       await waitFor(() => {
    //         expect(getByRole('list')).toBeInTheDocument();
    //       });

    //       act(() =>
    //         dispatchChannelTruncatedEvent(chatClient, channel1.channel),
    //       );

    //       await waitFor(() => {
    //         expect(onChannelTruncated).toHaveBeenCalledTimes(1);
    //       });
    //     });
    //   });
  });
});
