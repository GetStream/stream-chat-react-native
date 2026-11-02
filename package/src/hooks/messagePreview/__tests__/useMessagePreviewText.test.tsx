import React, { PropsWithChildren } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import type { Attachment, PollResponse, StreamChat } from 'stream-chat';

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
  const render = async (
    message: ReturnType<typeof generateMessage>,
    prepareClient?: (client: StreamChat) => void,
  ) => {
    const { client } = await initiateClientWithChannels();
    prepareClient?.(client);
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

  describe('poll messages', () => {
    const poll = {
      id: 'poll-id',
      latest_answers: [],
      latest_votes_by_option: {},
      name: 'Favourite colour?',
      name_i18n: { es_text: '¿Color favorito?', language: 'en' },
      options: [],
      vote_count: 0,
      vote_counts_by_option: {},
    } as unknown as PollResponse;

    const renderPollMessage = (language: string) => {
      const message = generateMessage({ poll, poll_id: poll.id, text: '' });
      return render(message, (client) => {
        (client.user as { language?: string }).language = language;
        client.polls.hydratePollCache([message]);
      });
    };

    it("shows the poll question in the user's language", async () => {
      const result = await renderPollMessage('es');
      expect(result.current).toBe('¿Color favorito?');
    });

    it('shows the original poll question when it has no translation', async () => {
      const result = await renderPollMessage('de');
      expect(result.current).toBe('Favourite colour?');
    });
  });
});
