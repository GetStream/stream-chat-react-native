import { AttachmentPreUploadMiddleware, LocalAttachment, MessageComposer } from 'stream-chat';

import { setupVideoAttachmentPreviewMiddleware } from '../attachments';

type InsertedMiddleware = {
  middleware: AttachmentPreUploadMiddleware[];
  position: { after?: string; before?: string };
  unique?: boolean;
};

const install = () => {
  const insert = jest.fn();
  const composer = {
    attachmentManager: { preUploadMiddlewareExecutor: { insert } },
  } as unknown as MessageComposer;

  setupVideoAttachmentPreviewMiddleware(composer);

  return { inserted: insert.mock.calls[0][0] as InsertedMiddleware };
};

const runPrepare = (attachment?: LocalAttachment) => {
  const { inserted } = install();
  const next = jest.fn((value: unknown) => value);
  const forward = jest.fn();

  inserted.middleware[0].handlers.prepare({
    forward,
    next,
    state: { attachment },
  } as unknown as Parameters<AttachmentPreUploadMiddleware['handlers']['prepare']>[0]);

  return { forward, next };
};

const localVideoAttachment = (overrides: Record<string, unknown> = {}) =>
  ({
    localMetadata: {
      file: { name: 'clip.mp4', uri: 'file://local/clip.mp4' },
      id: 'clip',
      uploadState: 'uploading',
    },
    thumb_url: 'file://local/clip-thumb.jpg',
    type: 'video',
    ...overrides,
  }) as unknown as LocalAttachment;

describe('setupVideoAttachmentPreviewMiddleware', () => {
  it('inserts the preview middleware after the upload-config check, without duplicating it', () => {
    const { inserted } = install();

    expect(inserted.middleware).toHaveLength(1);
    expect(inserted.middleware[0].id).toBe(
      'stream-io/message-composer-ui-middleware/video-attachment-preview',
    );
    // After the config check, so a blocked file is rejected on its real size rather than the
    // thumbnail's, and `unique` so a re-render cannot stack copies of it.
    expect(inserted.position).toEqual({
      after: 'stream-io/attachment-manager-middleware/file-upload-config-check',
    });
    expect(inserted.unique).toBe(true);
  });

  it('uses the thumbnail as the preview uri of a local video', () => {
    const { forward, next } = runPrepare(localVideoAttachment());

    expect(forward).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    const state = next.mock.calls[0][0] as { attachment: LocalAttachment };
    expect(state.attachment.localMetadata.previewUri).toBe('file://local/clip-thumb.jpg');
    // Everything else is carried through untouched.
    expect(state.attachment.localMetadata.id).toBe('clip');
    expect(state.attachment.thumb_url).toBe('file://local/clip-thumb.jpg');
  });

  it('leaves a video without a thumbnail without a preview uri', () => {
    const { next } = runPrepare(localVideoAttachment({ thumb_url: undefined }));

    const state = next.mock.calls[0][0] as { attachment: LocalAttachment };
    expect(state.attachment.localMetadata.previewUri).toBeUndefined();
  });

  it('forwards anything that is not a local video', () => {
    const image = runPrepare(
      localVideoAttachment({ image_url: 'file://local/photo.jpg', type: 'image' }),
    );
    expect(image.next).not.toHaveBeenCalled();
    expect(image.forward).toHaveBeenCalledTimes(1);

    const none = runPrepare(undefined);
    expect(none.next).not.toHaveBeenCalled();
    expect(none.forward).toHaveBeenCalledTimes(1);
  });
});
