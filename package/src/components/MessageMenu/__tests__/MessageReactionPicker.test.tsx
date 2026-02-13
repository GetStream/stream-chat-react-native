import React from 'react';

import { fireEvent, render, cleanup, waitFor } from '@testing-library/react-native';

import {
  MessageContextValue,
  MessageProvider,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  MessagesProvider,
} from '../../../contexts/messagesContext/MessagesContext';
import {
  OwnCapabilitiesContextValue,
  OwnCapabilitiesProvider,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { NativeHandlers } from '../../../native';
import { Chat } from '../../Chat/Chat';
import { MessageReactionPicker } from '../MessageReactionPicker';

jest.mock('../../../native', () => ({
  NativeHandlers: {
    triggerHaptic: jest.fn(),
  },
}));

const mockSupportedReactions = [
  { Icon: () => null, isMain: true, type: 'like' },
  { Icon: () => null, isMain: true, type: 'love' },
];

const defaultProps = {
  dismissOverlay: jest.fn(),
  handleReaction: jest.fn(),
  ownReactionTypes: ['like'],
};

describe('MessageReactionPicker', () => {
  let client;
  let renderComponent;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'reaction-test-user' });
    renderComponent = (props = {}, ownCapabilities = { sendReaction: true }) =>
      render(
        <Chat client={client}>
          <ThemeProvider theme={defaultTheme}>
            <OwnCapabilitiesProvider value={{ ...ownCapabilities } as OwnCapabilitiesContextValue}>
              <MessagesProvider
                value={
                  { supportedReactions: mockSupportedReactions } as unknown as MessagesContextValue
                }
              >
                <MessageProvider
                  value={
                    {
                      message: { own_reactions: [{ type: 'like' }] },
                    } as unknown as MessageContextValue
                  }
                >
                  <MessageReactionPicker {...defaultProps} {...props} />
                </MessageProvider>
              </MessagesProvider>
            </OwnCapabilitiesProvider>
          </ThemeProvider>
        </Chat>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders correctly with supported reactions', async () => {
    const { getAllByLabelText, getByLabelText } = renderComponent();
    await waitFor(() => {
      expect(getByLabelText('Reaction Selector on long pressing message')).toBeTruthy();
      expect(getAllByLabelText(/\breaction-button[^\s]+/)).toHaveLength(
        mockSupportedReactions.length,
      );
    });
  });

  it('does not render when sendReaction capability is false', () => {
    const { queryByLabelText } = renderComponent({}, { sendReaction: false });
    expect(queryByLabelText('Reaction Selector on long pressing message')).toBeNull();
  });

  it('marks own reactions as selected', async () => {
    const { getAllByLabelText } = renderComponent();

    await waitFor(() => {
      const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);
      expect(reactionButtons[0].props.accessibilityLabel).toBe('reaction-button-like-selected');
      expect(reactionButtons[1].props.accessibilityLabel).toBe('reaction-button-love-unselected');
    });
  });

  it('calls handleReaction and dismissOverlay when a reaction is pressed', async () => {
    const { getAllByLabelText } = renderComponent();

    await waitFor(() => {
      const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);
      fireEvent.press(reactionButtons[1]);
      expect(defaultProps.handleReaction).toHaveBeenCalledWith('love');
      expect(defaultProps.dismissOverlay).toHaveBeenCalled();
      expect(NativeHandlers.triggerHaptic).toHaveBeenCalledWith('impactLight');
    });
  });

  it("doesn't call handleReaction when it's not provided", async () => {
    const { getAllByLabelText } = renderComponent({ handleReaction: undefined });
    await waitFor(() => {
      const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);

      fireEvent.press(reactionButtons[1]);

      expect(defaultProps.handleReaction).not.toHaveBeenCalled();
    });
  });

  it('uses provided supportedReactions prop over context value', async () => {
    const customSupportedReactions = [
      { Icon: () => null, isMain: true, type: 'wow' },
      { Icon: () => null, isMain: true, type: 'haha' },
    ];
    const { getAllByLabelText } = renderComponent({ supportedReactions: customSupportedReactions });

    await waitFor(() => {
      const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);
      expect(reactionButtons).toHaveLength(customSupportedReactions.length);
    });
  });
});
