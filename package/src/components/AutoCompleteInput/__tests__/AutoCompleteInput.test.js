import React from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AutoCompleteInput } from '../AutoCompleteInput';
import { AutoCompleteSuggestionList } from '../AutoCompleteSuggestionList';

describe('AutoCompleteInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getAutoCompleteComponent = () => (
    <Chat client={chatClient}>
      <Channel channel={channel}>
        <AutoCompleteInput />
        <AutoCompleteSuggestionList />
      </Channel>
    </Chat>
  );

  const initializeChannel = async (c) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    await initializeChannel(generateChannelResponse());
  });

  afterEach(() => {
    channel = null;
  });

  it('should render AutoCompleteInput and trigger open/close suggestions with / commands', async () => {
    const { queryByTestId } = render(getAutoCompleteComponent());

    const input = queryByTestId('auto-complete-text-input');

    const onSelectionChange = input.props.onSelectionChange;

    await waitFor(() => {
      expect(input).toBeTruthy();
    });

    await act(async () => {
      await onSelectionChange({
        nativeEvent: {
          selection: {
            end: 1,
            start: 1,
          },
        },
      });
      await fireEvent.changeText(input, '/');
    });
  });
});
