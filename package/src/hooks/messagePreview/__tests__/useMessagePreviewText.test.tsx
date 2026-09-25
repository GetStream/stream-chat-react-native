import React, { PropsWithChildren } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import type { Attachment } from 'stream-chat';

import { Chat } from '../../../components/Chat/Chat';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/attachments';
import { generateMessage } from '../../../mock-builders/generator/message';
import { useMessagePreviewText } from '../useMessagePreviewText';

describe('useMessagePreviewText', () => {
  const render = async (message: ReturnType<typeof generateMessage>) => {
    const { client } = await initiateClientWithChannels();
    const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;
    const { result } = renderHook(() => useMessagePreviewText({ message }), { wrapper });
    return result;
  };

  const withAttachments = (attachments?: Attachment[]) =>
    generateMessage({ attachments, text: '' });

  // Drafts can have no text and no attachments; they rendered "{{count}} Files" / "0 Audios".
  it.each([
    ['absent', undefined],
    ['empty', []],
  ])('returns an empty preview when attachments are %s', async (_, attachments) => {
    const result = await render(withAttachments(attachments));
    expect(result.current).toBe('');
  });

  it('counts mixed attachments as files', async () => {
    const result = await render(
      withAttachments([generateImageAttachment(), generateFileAttachment()]),
    );
    // Counted copy comes from the translations, which load asynchronously.
    await waitFor(() => expect(result.current).toBe('2 Files'));
  });

  it('counts audio-only attachments as audios', async () => {
    const result = await render(
      withAttachments([generateAudioAttachment(), generateAudioAttachment()]),
    );
    // Counted copy comes from the translations, which load asynchronously.
    await waitFor(() => expect(result.current).toBe('2 Audios'));
  });

  it('prefers the message text over its attachments', async () => {
    const result = await render(
      generateMessage({ attachments: [generateFileAttachment()], text: 'hello' }),
    );
    expect(result.current).toBe('hello');
  });
});
