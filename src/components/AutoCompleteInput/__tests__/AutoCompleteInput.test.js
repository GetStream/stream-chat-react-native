import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import AutoCompleteInput from '../AutoCompleteInput';

import { Chat } from '../../Chat';
import { SuggestionsContext } from '../../../context';

import { ACITriggerSettings } from '../../../utils';

describe('AutoCompleteInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <SuggestionsContext.Provider value={props}>
        <AutoCompleteInput
          onChange={jest.fn}
          triggerSettings={ACITriggerSettings({
            channel,
            onMentionSelectItem: jest.fn(),
            t: jest.fn(),
          })}
          value={props.value}
        />
      </SuggestionsContext.Provider>
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

    props.value = '/';
    rerender(getComponent(props));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(props.closeSuggestions).toHaveBeenCalledTimes(0);
      expect(props.openSuggestions).toHaveBeenCalledTimes(1);
    });

    props.value = '';
    rerender(getComponent(props));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(props.closeSuggestions).toHaveBeenCalledTimes(1);
      expect(props.openSuggestions).toHaveBeenCalledTimes(1);
    });
  });

  // TODO: figure out how to make tests work for @ mentions with needing to update function state values
});
