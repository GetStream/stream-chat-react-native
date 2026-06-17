import { renderHook } from '@testing-library/react-native';

import type { MessageResponse } from 'stream-chat';

import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { useMediaList } from '../hooks/useMediaList';

const messageWithAttachments = (id: string, attachments: unknown[]): MessageResponse =>
  generateMessage({ attachments: attachments as never, id }) as unknown as MessageResponse;

describe('useMediaList', () => {
  it('returns an empty array when there are no messages', () => {
    const { result } = renderHook(() => useMediaList(undefined));
    expect(result.current).toEqual([]);

    const { result: emptyResult } = renderHook(() => useMediaList([]));
    expect(emptyResult.current).toEqual([]);
  });

  it('returns one tile per image/video attachment and skips non-media and scraped attachments', () => {
    const messageA = messageWithAttachments('m-1', [
      generateImageAttachment(),
      generateVideoAttachment(),
    ]);
    const messageB = messageWithAttachments('m-2', [
      // excluded: image used as a link preview / og scrape
      generateImageAttachment({ og_scrape_url: 'https://example.com' }),
      generateImageAttachment({ title_link: 'https://example.com' }),
      // excluded: not media
      { type: 'file' },
      // included
      generateImageAttachment(),
    ]);

    const { result } = renderHook(() => useMediaList([messageA, messageB]));

    expect(result.current.map((tile) => `${tile.message.id}-${tile.attachment.type}`)).toEqual([
      'm-1-image',
      'm-1-video',
      'm-2-image',
    ]);
  });

  it('skips messages without attachments', () => {
    const message = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;
    const { result } = renderHook(() => useMediaList([message]));
    expect(result.current).toEqual([]);
  });
});
