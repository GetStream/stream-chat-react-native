import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

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
import { NativeHandlers } from '../../../native';
import { MessageReactionPicker } from '../MessageReactionPicker';

jest.mock('../../../native', () => ({
  NativeHandlers: {
    triggerHaptic: jest.fn(),
  },
}));

const mockSupportedReactions = [
  { Icon: () => null, type: 'like' },
  { Icon: () => null, type: 'love' },
];

const defaultProps = {
  dismissOverlay: jest.fn(),
  handleReaction: jest.fn(),
  ownReactionTypes: ['like'],
};

const renderComponent = (props = {}, ownCapabilities = { sendReaction: true }) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <OwnCapabilitiesProvider value={{ ...ownCapabilities } as OwnCapabilitiesContextValue}>
        <MessagesProvider
          value={{ supportedReactions: mockSupportedReactions } as unknown as MessagesContextValue}
        >
          <MessageReactionPicker {...defaultProps} {...props} />
        </MessagesProvider>
      </OwnCapabilitiesProvider>
    </ThemeProvider>,
  );

describe('MessageReactionPicker', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with supported reactions', () => {
    const { getAllByLabelText, getByLabelText } = renderComponent();
    expect(getByLabelText('Reaction Selector on long pressing message')).toBeTruthy();
    expect(getAllByLabelText(/\breaction-button[^\s]+/)).toHaveLength(
      mockSupportedReactions.length,
    );
  });

  it('does not render when sendReaction capability is false', () => {
    const { queryByLabelText } = renderComponent({}, { sendReaction: false });
    expect(queryByLabelText('Reaction Selector on long pressing message')).toBeNull();
  });

  it('marks own reactions as selected', () => {
    const { getAllByLabelText } = renderComponent();
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);

    expect(reactionButtons[0].props.accessibilityLabel).toBe('reaction-button-like-selected');
    expect(reactionButtons[1].props.accessibilityLabel).toBe('reaction-button-love-unselected');
  });

  it('calls handleReaction and dismissOverlay when a reaction is pressed', () => {
    const { getAllByLabelText } = renderComponent();
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);

    fireEvent.press(reactionButtons[1]);

    expect(defaultProps.handleReaction).toHaveBeenCalledWith('love');
    expect(defaultProps.dismissOverlay).toHaveBeenCalled();
    expect(NativeHandlers.triggerHaptic).toHaveBeenCalledWith('impactLight');
  });

  it("doesn't call handleReaction when it's not provided", () => {
    const { getAllByLabelText } = renderComponent({ handleReaction: undefined });
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);

    fireEvent.press(reactionButtons[1]);

    expect(defaultProps.handleReaction).not.toHaveBeenCalled();
  });

  it('uses provided supportedReactions prop over context value', () => {
    const customSupportedReactions = [
      { Icon: () => null, type: 'wow' },
      { Icon: () => null, type: 'haha' },
    ];
    const { getAllByLabelText } = renderComponent({ supportedReactions: customSupportedReactions });
    const reactionButtons = getAllByLabelText(/\breaction-button[^\s]+/);
    expect(reactionButtons).toHaveLength(customSupportedReactions.length);
  });
});
