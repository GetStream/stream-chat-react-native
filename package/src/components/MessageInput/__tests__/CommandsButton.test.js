import React from 'react';

import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { SendButton } from '../SendButton';

const renderComponent = ({ client, channel, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel channel={channel}>
          <SendButton {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};
