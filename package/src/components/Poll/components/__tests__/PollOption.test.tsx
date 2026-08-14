import React from 'react';
import { StyleSheet } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import {
  OwnCapabilitiesProvider,
  PollContextProvider,
  ThemeProvider,
  TranslationProvider,
} from '../../../../contexts';
import { mergeThemes } from '../../../../contexts/themeContext/ThemeContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { PollOption } from '../PollOption';

const option = { id: 'option-1', text: 'An option' };

const mockIsPollCreatedByCurrentUser = jest.fn();

jest.mock('../../hook/useIsPollCreatedByCurrentUser', () => ({
  useIsPollCreatedByCurrentUser: () => mockIsPollCreatedByCurrentUser(),
}));

jest.mock('../../hooks/usePollState', () => ({
  usePollState: () => ({
    isClosed: false,
    latestVotesByOption: {},
    ownVotesByOptionId: {},
    voteCount: 4,
    voteCountsByOption: { 'option-1': 2 },
  }),
}));

jest.mock('../../hooks/usePollVoteToggle', () => ({
  usePollVoteToggle: () => jest.fn(),
}));

describe('PollOption chat text side', () => {
  const lightTheme = mergeThemes({ scheme: 'light' });

  const renderOption = ({ forceIncoming }: { forceIncoming?: boolean } = {}) =>
    render(
      <ThemeProvider>
        <TranslationProvider value={{ t: (key: string) => key } as never}>
          <OwnCapabilitiesProvider value={{ castPollVote: true } as never}>
            <PollContextProvider
              value={{ message: generateMessage(), poll: { data: {} } as never }}
            >
              <PollOption forceIncoming={forceIncoming} option={option as never} />
            </PollContextProvider>
          </OwnCapabilitiesProvider>
        </TranslationProvider>
      </ThemeProvider>,
    );

  const optionTextColor = () =>
    StyleSheet.flatten(screen.getByText('An option').props.style)?.color;

  const voteButtonBorderColor = () => {
    const style = screen.getByLabelText('An option').props.style;
    return StyleSheet.flatten(typeof style === 'function' ? style({ pressed: false }) : style)
      ?.borderColor;
  };

  afterEach(() => {
    mockIsPollCreatedByCurrentUser.mockReset();
  });

  it('uses the outgoing chat text colour for our own poll', () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(true);
    renderOption();

    expect(optionTextColor()).toBe(lightTheme.semantics.chatTextOutgoing);
  });

  it("uses the incoming chat text colour for another user's poll", () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(false);
    renderOption();

    expect(optionTextColor()).toBe(lightTheme.semantics.chatTextIncoming);
  });

  // The full-options list is a neutral card, not a bubble, so `forceIncoming`
  // has to win over ownership for every token - the vote button included.
  it('forces incoming text and vote button border on our own poll', () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(true);
    renderOption({ forceIncoming: true });

    expect(optionTextColor()).toBe(lightTheme.semantics.chatTextIncoming);
    expect(voteButtonBorderColor()).toBe(lightTheme.semantics.chatBorderOnChatIncoming);
  });

  it('uses the outgoing vote button border for our own poll in the bubble', () => {
    mockIsPollCreatedByCurrentUser.mockReturnValue(true);
    renderOption();

    expect(voteButtonBorderColor()).toBe(lightTheme.semantics.chatBorderOnChatOutgoing);
  });
});
