import React from 'react';

import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageContext } from '../../../../contexts/messageContext/MessageContext';
import { MessageListItemProvider } from '../../../../contexts/messageListItemContext/MessageListItemContext';
import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';

import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { MessageComposer } from '../../../MessageInput/MessageComposer';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';
import { Message } from '../../Message';
import { MessageOverlayWrapper } from '../../MessageOverlayWrapper';

const OverlayStateText = ({ label }) => {
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return <Text>{`${label}:${shouldUseOverlayStyles ? 'overlay' : 'normal'}`}</Text>;
};

const OverlayTrigger = () => {
  const { onLongPress } = useMessageContext();

  return (
    <Pressable
      onLongPress={() => onLongPress({ emitter: 'message' })}
      testID='custom-overlay-trigger'
    >
      <Text>Open overlay</Text>
    </Pressable>
  );
};

const CustomMessageItemView = () => (
  <View testID='custom-message-item-view'>
    <OverlayStateText label='outside' />
    <MessageOverlayWrapper targetId='custom-overlay-target' testID='custom-overlay-target'>
      <OverlayStateText label='inside' />
      <OverlayTrigger />
    </MessageOverlayWrapper>
  </View>
);

describe('Message', () => {
  let channel;
  let chatClient;
  let renderMessage;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options, channelProps, componentOverrides) =>
      render(
        <SafeAreaProvider>
          <OverlayProvider>
            <MessageListItemProvider
              value={{
                goToMessage: jest.fn(),
                modifiedTheme: {},
                onThreadSelect: jest.fn(),
                setNativeScrollability: jest.fn(),
              }}
            >
              <Chat client={chatClient}>
                {componentOverrides ? (
                  <WithComponents overrides={componentOverrides}>
                    <Channel channel={channel} {...channelProps}>
                      <Message groupStyles={['bottom']} {...options} />
                      <MessageComposer />
                    </Channel>
                  </WithComponents>
                ) : (
                  <Channel channel={channel} {...channelProps}>
                    <Message groupStyles={['bottom']} {...options} />
                    <MessageComposer />
                  </Channel>
                )}
              </Chat>
            </MessageListItemProvider>
          </OverlayProvider>
        </SafeAreaProvider>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the Message and MessageItemView components', async () => {
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-item-view-wrapper')).toBeTruthy();
    });
  });

  it('calls the `onLongPressMessage` prop function if it exists', async () => {
    const message = generateMessage({ user });
    const onLongPressMessage = jest.fn();

    const { getByTestId } = renderMessage({
      message,
      onLongPressMessage,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(onLongPressMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(onLongPressMessage).toHaveBeenCalledTimes(1);
    });
  });

  it('teleports a custom overlay target without applying overlay styles to siblings', async () => {
    const message = generateMessage({ user });
    const { getByTestId, getByText } = renderMessage(
      { message },
      {
        messageOverlayTargetId: 'custom-overlay-target',
      },
      {
        MessageItemView: CustomMessageItemView,
      },
    );

    await waitFor(() => {
      expect(getByTestId('custom-message-item-view')).toBeTruthy();
      expect(getByText('outside:normal')).toBeTruthy();
      expect(getByText('inside:normal')).toBeTruthy();
    });

    fireEvent(getByTestId('custom-overlay-trigger'), 'longPress');

    await waitFor(() => {
      expect(getByText('outside:normal')).toBeTruthy();
      expect(getByText('inside:overlay')).toBeTruthy();
      expect(getByTestId('custom-overlay-target-placeholder')).toBeTruthy();
    });
  });
});
