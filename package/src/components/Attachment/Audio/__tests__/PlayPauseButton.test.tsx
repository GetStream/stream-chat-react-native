import React from 'react';
import { StyleSheet } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { mergeThemes, ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { PlayPauseButton } from '../PlayPauseButton';

describe('PlayPauseButton', () => {
  const lightTheme = mergeThemes({ scheme: 'light' });

  const renderButton = (containerStyle?: Record<string, unknown>) =>
    render(
      <ThemeProvider>
        <PlayPauseButton
          containerStyle={containerStyle}
          isPlaying={false}
          onPress={jest.fn()}
          testID='play-pause-button'
        />
      </ThemeProvider>,
    );

  const borderColorOf = () => {
    const style = screen.getByTestId('play-pause-button').props.style;
    return StyleSheet.flatten(typeof style === 'function' ? style({ pressed: false }) : style)
      ?.borderColor;
  };

  // This control also renders in the composer's attachment previews, which are
  // not a message bubble - so it must not reach for a chat side token.
  it('defaults to the neutral playback toggle border, not a chat bubble border', () => {
    renderButton();

    expect(borderColorOf()).toBe(lightTheme.semantics.controlPlaybackToggleBorder);
    expect(borderColorOf()).not.toBe(lightTheme.semantics.chatBorderOnChatIncoming);
  });

  it('lets in-bubble callers override the border with the resolved chat side', () => {
    renderButton({ borderColor: lightTheme.semantics.chatBorderOnChatOutgoing });

    expect(borderColorOf()).toBe(lightTheme.semantics.chatBorderOnChatOutgoing);
  });
});
