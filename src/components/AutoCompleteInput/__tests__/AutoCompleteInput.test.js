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

import { ACITriggerSettings } from '../../../utils';

describe('AutoCompleteInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <AutoCompleteInput
        onChange={jest.fn}
        triggerSettings={ACITriggerSettings({
          channel,
          onMentionSelectItem: jest.fn(),
          t: jest.fn(),
        })}
        {...props}
      />
    </Chat>
  );

  const initializeChannel = async (c) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
    const closeSuggestions = jest.fn();
    const openSuggestions = jest.fn();

    await initializeChannel(generateChannel());

    const { getByTestId, rerender } = render(
      getComponent({
        closeSuggestions,
        openSuggestions,
        value: '',
      }),
    );

    await waitFor(() => {
      expect(getByTestId('auto-complete-text-input')).toBeTruthy();
      expect(openSuggestions).toHaveBeenCalledTimes(0);
      expect(closeSuggestions).toHaveBeenCalledTimes(0);
    });

    rerender(
      getComponent({
        closeSuggestions,
        openSuggestions,
        value: '/',
      }),
    );

    await waitFor(() => expect(openSuggestions).toHaveBeenCalledTimes(1));

    rerender(
      getComponent({
        closeSuggestions,
        openSuggestions,
        value: '',
      }),
    );

    await waitFor(() => expect(closeSuggestions).toHaveBeenCalledTimes(1));
  });

  // TODO: figure out how to make tests work for @ mentions with needing to update function state values
});
