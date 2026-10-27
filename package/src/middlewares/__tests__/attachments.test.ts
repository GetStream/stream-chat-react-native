import { LocalAttachment, MessageComposer } from 'stream-chat';

import { createAttachmentsCompositionMiddleware } from '../attachments';

type AttachmentUploadState = 'finished' | 'blocked' | 'pending' | 'uploading' | 'failed';

const createLocalImageAttachment = (
  id: string,
  uploadState: AttachmentUploadState,
): LocalAttachment =>
  ({
    image_url: `file://local/${id}`,
    localMetadata: {
      file: { name: id, uri: `file://local/${id}` },
      id,
      uploadState,
    },
    // custom marker that survives localAttachmentToAttachment mapping, used to
    // identify which attachments ended up in the composed message
    title: id,
    type: 'image',
  }) as unknown as LocalAttachment;

const runComposeHandler = (attachments: LocalAttachment[]) => {
  const composer = {
    attachmentManager: { attachments },
  } as unknown as MessageComposer;

  const middleware = createAttachmentsCompositionMiddleware(composer);

  const next = jest.fn((value: unknown) => value);
  const forward = jest.fn();
  const state = {
    localMessage: { attachments: [] },
    message: { attachments: [] },
  };

  middleware.handlers.compose({
    forward,
    next,
    state,
  } as unknown as Parameters<typeof middleware.handlers.compose>[0]);

  return { forward, next };
};

describe('createAttachmentsCompositionMiddleware', () => {
  it('excludes blocked attachments from the composed message', () => {
    const { forward, next } = runComposeHandler([
      createLocalImageAttachment('finished-attachment', 'finished'),
      createLocalImageAttachment('blocked-attachment', 'blocked'),
      createLocalImageAttachment('pending-attachment', 'pending'),
    ]);

    expect(forward).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    const composedState = next.mock.calls[0][0] as {
      message: { attachments: { title?: string }[] };
    };
    const titles = composedState.message.attachments.map((attachment) => attachment.title);

    expect(titles).toEqual(['finished-attachment', 'pending-attachment']);
  });

  it('forwards without attachments when every attachment is blocked', () => {
    const { forward, next } = runComposeHandler([
      createLocalImageAttachment('blocked-1', 'blocked'),
      createLocalImageAttachment('blocked-2', 'blocked'),
    ]);

    expect(next).not.toHaveBeenCalled();
    expect(forward).toHaveBeenCalledTimes(1);
  });
});
