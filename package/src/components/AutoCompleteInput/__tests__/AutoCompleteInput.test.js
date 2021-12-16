import React from 'react';

import { render, waitFor } from '@testing-library/react-native';




import { SuggestionsProvider } from '../../../contexts/suggestionsContext/SuggestionsContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { ACITriggerSettings } from '../../../utils/utils';
import { Chat } from '../../Chat/Chat';
import { AutoCompleteInput } from '../AutoCompleteInput';

describe('AutoCompleteInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <SuggestionsProvider value={props}>
        <AutoCompleteInput
          giphyEnabled
          onChange={jest.fn}
          text={props.text}
          triggerSettings={ACITriggerSettings({
            channel,
            onMentionSelectItem: jest.fn(),
            t: jest.fn(),
          })}
        />
      </SuggestionsProvider>
    </Chat>
  );

  const initializeChannel = async (c) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should render AutoCompleteInput and trigger open/close suggestions with / commands', async () => {
    const props = {
      closeSuggestions: jest.fn(),
      openSuggestions: jest.fn(),
    };

    await initializeChannel(generateChannel());

    const { queryByTestId, rerender } = render(getComponent(props));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(props.closeSuggestions).toHaveBeenCalledTimes(0);
      expect(props.openSuggestions).toHaveBeenCalledTimes(0);
    });

    rerender(getComponent({ ...props, text: '/' }));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
    });

    rerender(getComponent({ ...props, text: '' }));
    rerender(getComponent(props));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
    });
  });

  // TODO: figure out how to make tests work for @ mentions with needing to update function state values
});
