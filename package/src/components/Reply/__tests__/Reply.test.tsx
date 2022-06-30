import React from 'react';

import { render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { Reply } from '../Reply';

describe('<Reply/>', () => {
  it('can be rendered outside of a MessageInputProvider', async () => {
    const oldEnvironment = process.env;
    process.env.NODE_ENV = 'not_test';

    const chatClient = await getTestClientWithUser({ id: 'neil' });

    const mockedChannel = generateChannelResponse();
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', 'some-chat');
    await channel.watch();

    const TestComponent = () => (
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} client={chatClient}>
            <Reply />
          </Channel>
        </Chat>
      </OverlayProvider>
    );

    try {
      const { toJSON } = render(<TestComponent />);

      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    } catch (error: unknown) {
      throw new Error(`Error thrown while rendering Reply: ${error}`);
    }

    process.env = oldEnvironment;
  });
});
