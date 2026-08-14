import React from 'react';
import { StyleSheet } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import {
  OwnCapabilitiesProvider,
  PollContextProvider,
  ThemeProvider,
  TranslationProvider,
} from '../../../contexts';
import { mergeThemes } from '../../../contexts/themeContext/ThemeContext';
import { generateMessage } from '../../../mock-builders/generator/message';
import { PollHeader } from '../Poll';

const mockIsPollCreatedByCurrentUser = jest.fn();

jest.mock('../hook/useIsPollCreatedByCurrentUser', () => ({
  useIsPollCreatedByCurrentUser: () => mockIsPollCreatedByCurrentUser(),
}));

jest.mock('../hooks/usePollState', () => ({
  usePollState: () => ({
    enforceUniqueVote: true,
    isClosed: false,
    maxVotesAllowed: undefined,
    name: 'A poll question',
  }),
}));

describe('PollHeader chat text side', () => {
  const lightTheme = mergeThemes({ scheme: 'light' });

  const renderHeader = () =>
    render(
      <ThemeProvider>
        <TranslationProvider value={{ t: (key: string) => key } as never}>
          <OwnCapabilitiesProvider value={{} as never}>
            <PollContextProvider
              value={{ message: generateMessage(), poll: { data: {} } as never }}
            >
              <PollHeader />
            </PollContextProvider>
          </OwnCapabilitiesProvider>
        </TranslationProvider>
      </ThemeProvider>,
    );

  const colorOf = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style)?.color;

  afterEach(() => {
    mockIsPollCreatedByCurrentUser.mockReset();
  });

  it('uses the outgoing chat text colour for our own poll', () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(true);
    renderHeader();

    expect(colorOf('A poll question')).toBe(lightTheme.semantics.chatTextOutgoing);
    expect(colorOf('Select one')).toBe(lightTheme.semantics.chatTextOutgoing);
  });

  it("uses the incoming chat text colour for another user's poll", () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(false);
    renderHeader();

    expect(colorOf('A poll question')).toBe(lightTheme.semantics.chatTextIncoming);
    expect(colorOf('Select one')).toBe(lightTheme.semantics.chatTextIncoming);
  });
});
