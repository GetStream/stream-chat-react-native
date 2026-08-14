import React from 'react';
import { StyleSheet } from 'react-native';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import type { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import { MessageProvider } from '../../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../../contexts/messagesContext/MessagesContext';
import { MessagesProvider } from '../../../../contexts/messagesContext/MessagesContext';
import { mergeThemes, ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { generateCardAttachment } from '../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { URLPreview } from '../URLPreview';
import { URLPreviewCompact } from '../URLPreviewCompact';

const lightTheme = mergeThemes({ scheme: 'light' });

/**
 * Both URL preview variants resolve every text colour from the same
 * incoming/outgoing pair, so the assertions are shared.
 */
describe.each([
  ['URLPreview', URLPreview],
  ['URLPreviewCompact', URLPreviewCompact],
])('%s chat text side', (_name, Component) => {
  const renderPreview = (messageContextValue: Partial<MessageContextValue> = {}) => {
    const attachment = generateCardAttachment({ title: 'A title', text: 'A description' });

    return render(
      <ThemeProvider>
        <MessagesProvider value={{} as unknown as MessagesContextValue}>
          <MessageProvider
            value={
              {
                message: generateMessage(),
                ...messageContextValue,
              } as unknown as MessageContextValue
            }
          >
            <Component attachment={attachment} />
          </MessageProvider>
        </MessagesProvider>
      </ThemeProvider>,
    );
  };

  const colorOf = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style)?.color;

  afterEach(cleanup);

  it('uses the outgoing chat text colour on our own message', async () => {
    renderPreview({ isMyMessage: true });

    await waitFor(() => {
      expect(colorOf('A title')).toBe(lightTheme.semantics.chatTextOutgoing);
    });
    expect(colorOf('A description')).toBe(lightTheme.semantics.chatTextOutgoing);
  });

  it("uses the incoming chat text colour on another user's message", async () => {
    renderPreview({ isMyMessage: false });

    await waitFor(() => {
      expect(colorOf('A title')).toBe(lightTheme.semantics.chatTextIncoming);
    });
    expect(colorOf('A description')).toBe(lightTheme.semantics.chatTextIncoming);
  });

  it('uses the outgoing attachment background on our own message', async () => {
    renderPreview({ isMyMessage: true });

    await waitFor(() => {
      expect(StyleSheet.flatten(screen.getByTestId('card-attachment').props.style)).toEqual(
        expect.objectContaining({
          backgroundColor: lightTheme.semantics.chatBgAttachmentOutgoing,
        }),
      );
    });
  });

  it('strokes the link icon with the same colour as the link text', async () => {
    renderPreview({ isMyMessage: true });

    // The URL text and its leading icon must not disagree on the side.
    await waitFor(() => {
      expect(screen.getByTestId('card-attachment')).toBeTruthy();
    });

    const linkIcon = screen.UNSAFE_getByProps({ stroke: lightTheme.semantics.chatTextOutgoing });
    expect(linkIcon).toBeTruthy();
  });
});
