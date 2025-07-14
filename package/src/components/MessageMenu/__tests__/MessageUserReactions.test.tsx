import React from 'react';

import { Text } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import { LocalMessage, ReactionResponse } from 'stream-chat';

import {
  MessagesContextValue,
  MessagesProvider,
} from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../contexts/translationContext/TranslationContext';
import { generateMessage } from '../../../mock-builders/generator/message';
import * as useFetchReactionsModule from '../hooks/useFetchReactions';
import { MessageUserReactions } from '../MessageUserReactions';
import { MessageUserReactionsItemProps } from '../MessageUserReactionsItem';

const mockTranslations = {
  t: jest.fn((key) => key),
};

const mockSupportedReactions = [
  { Icon: () => null, type: 'like' },
  { Icon: () => null, type: 'love' },
];

const defaultProps = {
  message: {
    ...generateMessage(),
    reaction_groups: { like: { count: 1, sum_scores: 1 }, love: { count: 1, sum_scores: 1 } },
  } as unknown as LocalMessage,
  supportedReactions: mockSupportedReactions,
};

const renderComponent = (props = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider value={mockTranslations as unknown as TranslationContextValue}>
        <MessagesProvider
          value={
            {
              MessageUserReactionsAvatar: () => null,
              MessageUserReactionsItem: (props: MessageUserReactionsItemProps) => (
                <Text>{props.reaction.id + ' ' + props.reaction.type}</Text>
              ),
            } as unknown as MessagesContextValue
          }
        >
          <MessageUserReactions {...defaultProps} {...props} />
        </MessagesProvider>
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('MessageUserReactions when the supportedReactions are defined', () => {
  beforeAll(() => {
    const mockLoadNextPage = jest.fn();

    const mockUseFetchReactions = jest.spyOn(useFetchReactionsModule, 'useFetchReactions');
    mockUseFetchReactions.mockReturnValue({
      loading: false,
      loadNextPage: mockLoadNextPage,
      reactions: [
        {
          type: 'like',
          user: { id: '1', image: 'user1.jpg', name: 'User 1' },
        } as unknown as ReactionResponse,
        {
          type: 'love',
          user: { id: '2', image: 'user2.jpg', name: 'User 2' },
        } as unknown as ReactionResponse,
      ],
    });
  });

  it('renders correctly', () => {
    const { getByLabelText, getByText } = renderComponent();
    expect(getByLabelText('User Reactions on long press message')).toBeTruthy();
    expect(getByText('Message Reactions')).toBeTruthy();
  });

  it('renders reaction buttons', () => {
    const { getByLabelText } = renderComponent();
    const likeReactionButton = getByLabelText('reaction-button-like-selected');
    expect(likeReactionButton).toBeDefined();
    const loveReactionButton = getByLabelText('reaction-button-love-unselected');
    expect(loveReactionButton).toBeDefined();
  });

  it('selects the first reaction by default', () => {
    const { getAllByLabelText } = renderComponent();
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);
    expect(reactionButtons[0].props.accessibilityLabel).toBe('reaction-button-like-selected');
    expect(reactionButtons[1].props.accessibilityLabel).toBe('reaction-button-love-unselected');
  });

  it('changes selected reaction when a reaction button is pressed', () => {
    const { getAllByLabelText } = renderComponent();
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);

    fireEvent.press(reactionButtons[1]);

    expect(reactionButtons[0].props.accessibilityLabel).toBe('reaction-button-like-unselected');
    expect(reactionButtons[1].props.accessibilityLabel).toBe('reaction-button-love-selected');
  });

  it('renders reactions list', () => {
    const { getByText } = renderComponent();
    const reactionItems = getByText('1 like');
    expect(reactionItems).toBeDefined();
  });

  it('uses provided reactions when passed as a prop', () => {
    const propReactions = [{ id: '3', image: 'user3.jpg', name: 'User 3', type: 'wow' }];
    const { getByText } = renderComponent({ reactions: propReactions });
    const reactionItem = getByText('3 wow');
    expect(reactionItem).toBeDefined();
  });

  it("don't render reaction buttons that is of unsupported type", () => {
    const { queryAllByLabelText } = renderComponent({
      message: { ...generateMessage(), reaction_groups: { money: 1 } },
    });
    const reactionButtons = queryAllByLabelText(/\breaction-button[^\s]+/);

    expect(reactionButtons.length).toBe(0);
  });
});

describe("MessageUserReactions when the supportedReactions aren't defined", () => {
  beforeAll(() => {
    const mockLoadNextPage = jest.fn();

    const mockUseFetchReactions = jest.spyOn(useFetchReactionsModule, 'useFetchReactions');
    mockUseFetchReactions.mockReturnValue({
      loading: false,
      loadNextPage: mockLoadNextPage,
      reactions: [
        {
          type: 'like',
          user: { id: '1', image: 'user1.jpg', name: 'User 1' },
        } as unknown as ReactionResponse,
        {
          type: 'love',
          user: { id: '2', image: 'user2.jpg', name: 'User 2' },
        } as unknown as ReactionResponse,
      ],
    });
  });

  it("don't render reaction buttons that is of unsupported type", () => {
    const { queryAllByLabelText } = renderComponent({
      message: { ...generateMessage(), reaction_groups: undefined },
      supportedReactions: undefined,
    });
    const reactionButtons = queryAllByLabelText(/\breaction-button[^\s]+/);

    expect(reactionButtons.length).toBe(0);
  });
});

describe('MessageUserReactions when the reactions are in loading phase', () => {
  beforeAll(() => {
    const mockLoadNextPage = jest.fn();

    const mockUseFetchReactions = jest.spyOn(useFetchReactionsModule, 'useFetchReactions');
    mockUseFetchReactions.mockReturnValue({
      loading: true,
      loadNextPage: mockLoadNextPage,
      reactions: [],
    });
  });

  it("don't render reactions flatlist when loading is false", () => {
    const { queryByLabelText } = renderComponent();
    const reactionsFlatList = queryByLabelText('reaction-flat-list');

    expect(reactionsFlatList).toBeNull();
  });
});
