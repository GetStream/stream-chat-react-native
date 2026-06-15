import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';

import type { Attachment, MessageResponse } from 'stream-chat';

import {
  TranslationProvider,
  type TranslationContextValue,
} from '../../../contexts/translationContext/TranslationContext';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { useFileAttachmentListSections } from '../hooks/useFileAttachmentListSections';

let translators: TranslationContextValue;

beforeAll(async () => {
  const i18nInstance = new Streami18n();
  translators = (await i18nInstance.getTranslators()) as unknown as TranslationContextValue;
});

const wrapper = ({ children }: PropsWithChildren) => (
  <TranslationProvider value={translators}>{children}</TranslationProvider>
);

const messageAt = (
  id: string,
  createdAt: string,
  attachments: Attachment[] = [generateFileAttachment()],
): MessageResponse =>
  generateMessage({
    attachments: attachments as never,
    created_at: new Date(createdAt),
    id,
  }) as unknown as MessageResponse;

describe('useFileAttachmentListSections', () => {
  it('returns an empty array when there are no messages', () => {
    const { result } = renderHook(() => useFileAttachmentListSections(undefined), { wrapper });
    expect(result.current).toEqual([]);

    const { result: emptyResult } = renderHook(() => useFileAttachmentListSections([]), {
      wrapper,
    });
    expect(emptyResult.current).toEqual([]);
  });

  it('gathers only file and audio attachments, skipping images', () => {
    const message = messageAt('m-1', '2026-03-15T00:00:00.000Z', [
      generateFileAttachment({ title: 'a-file.pdf' }),
      generateImageAttachment({ title: 'a-photo.png' }),
      generateAudioAttachment({ title: 'a-clip.mp3' }),
    ]);

    const { result } = renderHook(() => useFileAttachmentListSections([message]), { wrapper });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].data.map((tile) => tile.attachment.title)).toEqual([
      'a-file.pdf',
      'a-clip.mp3',
    ]);
    expect(result.current[0].data.every((tile) => tile.message === message)).toBe(true);
  });

  it('skips OG/scraped link-preview attachments', () => {
    const message = messageAt('m-og', '2026-03-15T00:00:00.000Z', [
      generateFileAttachment({ title: 'a-file.pdf' }),
      generateFileAttachment({
        og_scrape_url: 'https://example.com',
        title: 'link-preview',
        title_link: 'https://example.com',
      }),
    ]);

    const { result } = renderHook(() => useFileAttachmentListSections([message]), { wrapper });

    expect(result.current[0].data.map((tile) => tile.attachment.title)).toEqual(['a-file.pdf']);
  });

  it('produces no section for a message without file or audio attachments', () => {
    const message = messageAt('m-1', '2026-03-15T00:00:00.000Z', [generateImageAttachment()]);

    const { result } = renderHook(() => useFileAttachmentListSections([message]), { wrapper });

    expect(result.current).toEqual([]);
  });

  it('groups messages into month sections in newest-first order', () => {
    const february = messageAt('m-feb', '2026-02-10T00:00:00.000Z');
    const march = messageAt('m-mar', '2026-03-15T00:00:00.000Z');

    // The search source returns messages newest-first; the hook only groups consecutive months.
    const { result } = renderHook(() => useFileAttachmentListSections([march, february]), {
      wrapper,
    });

    expect(result.current.map((section) => section.title)).toEqual(['March 2026', 'February 2026']);
    expect(result.current[0].data.map((tile) => tile.message.id)).toEqual(['m-mar']);
    expect(result.current[1].data.map((tile) => tile.message.id)).toEqual(['m-feb']);
  });

  it('keeps attachments from the same month under a single section', () => {
    const early = messageAt('m-1', '2026-03-02T00:00:00.000Z');
    const late = messageAt('m-2', '2026-03-28T00:00:00.000Z');

    // Provided newest-first, as the search source returns them.
    const { result } = renderHook(() => useFileAttachmentListSections([late, early]), { wrapper });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].title).toBe('March 2026');
    expect(result.current[0].data.map((tile) => tile.message.id)).toEqual(['m-2', 'm-1']);
  });

  it('emits one tile per file attachment within a message', () => {
    const message = messageAt('m-1', '2026-03-15T00:00:00.000Z', [
      generateFileAttachment({ title: 'one.pdf' }),
      generateFileAttachment({ title: 'two.pdf' }),
    ]);

    const { result } = renderHook(() => useFileAttachmentListSections([message]), { wrapper });

    expect(result.current[0].data.map((tile) => tile.attachment.title)).toEqual([
      'one.pdf',
      'two.pdf',
    ]);
  });

  it('formats the section title via the timestamp/FileAttachmentListSection translation key', () => {
    const customTranslators = {
      t: jest.fn((key: string) =>
        key === 'timestamp/FileAttachmentListSection' ? 'CUSTOM TITLE' : key,
      ),
      tDateTimeParser: translators.tDateTimeParser,
      userLanguage: 'en',
    } as unknown as TranslationContextValue;

    const customWrapper = ({ children }: PropsWithChildren) => (
      <TranslationProvider value={customTranslators}>{children}</TranslationProvider>
    );

    const { result } = renderHook(
      () => useFileAttachmentListSections([messageAt('m-1', '2026-03-15T00:00:00.000Z')]),
      { wrapper: customWrapper },
    );

    expect(result.current[0].title).toBe('CUSTOM TITLE');
    // The MMMM YYYY format lives in the translation string itself, so the hook only forwards
    // the timestamp to `t` — it does not pass a `format` option.
    expect(customTranslators.t).toHaveBeenCalledWith(
      'timestamp/FileAttachmentListSection',
      expect.objectContaining({ timestamp: expect.any(Date) }),
    );
  });
});
