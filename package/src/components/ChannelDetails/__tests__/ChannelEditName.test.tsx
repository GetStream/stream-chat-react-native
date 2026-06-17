import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { EditChannelDetailsStore } from '../../../state-store/edit-channel-details-store';
import { ChannelEditName } from '../components/ChannelEditName';

const buildChannel = (overrides?: { name?: string }): Channel =>
  ({
    cid: 'messaging:test',
    data: {
      name: overrides && 'name' in overrides ? overrides.name : 'Original',
    },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

const renderComponent = ({ channel }: { channel: Channel }) => {
  const store = new EditChannelDetailsStore(channel);
  const utils = render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChatContext.Provider
          value={
            { client: { on: () => ({ unsubscribe: () => undefined }), userID: 'me' } } as never
          }
        >
          <ChannelEditDetailsContext.Provider value={{ store }}>
            <ChannelEditName />
          </ChannelEditDetailsContext.Provider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );
  return { ...utils, store };
};

describe('ChannelEditName', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input pre-filled with the channel name', () => {
    renderComponent({ channel: buildChannel({ name: 'Original' }) });

    expect(screen.getByTestId('channel-edit-name-input').props.value).toBe('Original');
  });

  it('renders the input empty when the channel has no name', () => {
    renderComponent({ channel: buildChannel({ name: undefined }) });

    expect(screen.getByTestId('channel-edit-name-input').props.value).toBe('');
  });

  it('writes the typed value to the store', () => {
    const { store } = renderComponent({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    expect(store.state.getLatestValue().currentName).toBe('Renamed');
    expect(screen.getByTestId('channel-edit-name-input').props.value).toBe('Renamed');
  });

  it('writes an empty string to the store when the user clears the input', () => {
    const { store } = renderComponent({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '');

    expect(store.state.getLatestValue().currentName).toBe('');
  });

  it('leaves currentName at the initial name on mount', () => {
    const { store } = renderComponent({ channel: buildChannel({ name: 'Original' }) });

    expect(store.state.getLatestValue().currentName).toBe('Original');
  });
});
