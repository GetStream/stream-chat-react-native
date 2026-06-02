import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
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

const renderComponent = ({
  channel,
  onNameChange = jest.fn(),
}: {
  channel: Channel;
  onNameChange?: (name: string) => void;
}) =>
  render(
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
          <ChannelDetailsContextProvider value={{ channel }}>
            <ChannelEditName onNameChange={onNameChange} />
          </ChannelDetailsContextProvider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );

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

  it('fires onNameChange with the typed value', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    expect(onNameChange).toHaveBeenLastCalledWith('Renamed');
  });

  it('fires onNameChange with an empty string when the user clears the input', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '');

    expect(onNameChange).toHaveBeenLastCalledWith('');
  });

  it('does not fire onNameChange on initial mount', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    expect(onNameChange).not.toHaveBeenCalled();
  });
});
