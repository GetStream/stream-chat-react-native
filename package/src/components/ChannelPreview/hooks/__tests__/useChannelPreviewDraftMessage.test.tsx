import { act, renderHook } from '@testing-library/react-native';
import type { Channel, LocalAttachment } from 'stream-chat';

import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { useChannelPreviewDraftMessage } from '../useChannelPreviewDraftMessage';

describe('useChannelPreviewDraftMessage', () => {
  let channel: Channel;

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
  });

  it('returns nothing for an empty composer', () => {
    const { result } = renderHook(() => useChannelPreviewDraftMessage({ channel }));

    expect(result.current).toBeUndefined();
  });

  it('returns a draft that only has attachments', () => {
    const attachment = {
      localMetadata: { id: 'local-image' },
      type: 'image',
    } as LocalAttachment;
    const { result } = renderHook(() => useChannelPreviewDraftMessage({ channel }));

    act(() => channel.messageComposer.attachmentManager.upsertAttachments([attachment]));

    expect(result.current).toMatchObject({ attachments: [attachment], text: '' });
  });
});
