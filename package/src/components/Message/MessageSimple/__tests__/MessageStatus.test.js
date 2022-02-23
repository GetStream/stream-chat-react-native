import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Streami18n } from '../../../../utils/Streami18n';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { MessageList } from '../../../MessageList/MessageList';
import { MessageStatus } from '../MessageStatus';

let chatClient;
let id;
let i18nInstance;

describe('MessageStatus', () => {
  beforeAll(async () => {
    id = 'testID';
    chatClient = await getTestClientWithUser({ id });
    i18nInstance = new Streami18n();
  });
  afterEach(cleanup);

  it('should render message status with delivered container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel>
            <MessageList>
              <MessageStatus
                lastReceivedId={message.id}
                message={{ ...message, status: 'received' }}
              />
            </MessageList>
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('delivered-container')).toBeTruthy();
    });
  });

  it('should render message status with read by container', async () => {
    const user = generateUser();
    const message = generateMessage({ readBy: 2, user });

    const { getByTestId, getByText, rerender, toJSON } = render(
      <OverlayProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel>
            <MessageList>
              <MessageStatus lastReceivedId={message.id} message={message} />
            </MessageList>
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('read-by-container')).toBeTruthy();
      expect(getByText(message.readBy.toString())).toBeTruthy();
    });

    const staticUser = generateStaticUser(0);
    const staticMessage = generateMessage({ readBy: 2, staticUser });

    rerender(
      <OverlayProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel>
            <MessageList>
              <MessageStatus lastReceivedId={staticMessage.id} message={staticMessage} />
            </MessageList>
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
      expect(getByTestId('read-by-container')).toBeTruthy();
      expect(getByText(staticMessage.readBy.toString())).toBeTruthy();
    });
  });

  it('should render message status with sending container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel>
            <MessageList>
              <MessageStatus message={{ ...message, status: 'sending' }} />
            </MessageList>
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('sending-container')).toBeTruthy();
    });
  });
});
