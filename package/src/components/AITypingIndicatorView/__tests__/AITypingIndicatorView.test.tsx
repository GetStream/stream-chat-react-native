import React from 'react';

import { render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useAnnounceOnStateChange } from '../../../a11y/hooks/useAnnounceOnStateChange';
import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { AITypingIndicatorView } from '../AITypingIndicatorView';
import { AIStates, useAIState } from '../hooks/useAIState';

jest.mock('../../../a11y/hooks/useAnnounceOnStateChange', () => ({
  useAnnounceOnStateChange: jest.fn(),
}));

jest.mock('../hooks/useAIState', () => {
  const actual = jest.requireActual('../hooks/useAIState');
  return {
    ...actual,
    useAIState: jest.fn(),
  };
});

const mockUseAIState = useAIState as jest.MockedFunction<typeof useAIState>;
const mockUseAnnounceOnStateChange = useAnnounceOnStateChange as jest.MockedFunction<
  typeof useAnnounceOnStateChange
>;

const renderComponent = (
  accessibility?: React.ComponentProps<typeof AccessibilityProvider>['value'],
) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <AccessibilityProvider value={accessibility}>
        <AITypingIndicatorView channel={{} as Channel} />
      </AccessibilityProvider>
    </ThemeProvider>,
  );

describe('AITypingIndicatorView', () => {
  beforeEach(() => {
    mockUseAIState.mockReturnValue({ aiState: AIStates.Thinking });
    jest.clearAllMocks();
  });

  it('does not announce typing state by default', () => {
    const { UNSAFE_queryByProps } = renderComponent();

    expect(mockUseAnnounceOnStateChange).toHaveBeenCalledWith(null);
    expect(UNSAFE_queryByProps({ accessibilityLiveRegion: 'polite' })).toBeNull();
  });

  it('does not announce typing state when a11y is enabled but typing announcements are off', () => {
    const { UNSAFE_queryByProps } = renderComponent({
      announceTypingIndicator: false,
      enabled: true,
    });

    expect(mockUseAnnounceOnStateChange).toHaveBeenCalledWith(null);
    expect(UNSAFE_queryByProps({ accessibilityLiveRegion: 'polite' })).toBeNull();
  });

  it('announces typing state when the typing announcement toggle is enabled', () => {
    const { UNSAFE_queryByProps } = renderComponent({
      announceTypingIndicator: true,
      enabled: true,
    });

    expect(mockUseAnnounceOnStateChange).toHaveBeenCalledWith('Thinking...');
    expect(UNSAFE_queryByProps({ accessibilityLiveRegion: 'polite' })).toBeTruthy();
  });
});
