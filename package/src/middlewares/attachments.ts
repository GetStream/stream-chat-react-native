import {
  Attachment,
  FileReference,
  isLocalImageAttachment,
  LocalAttachment,
  MessageComposer,
  MessageComposerMiddlewareState,
  MessageCompositionMiddleware,
  MessageDraftComposerMiddlewareValueState,
  MessageDraftCompositionMiddleware,
  MiddlewareHandlerParams,
} from 'stream-chat';

const localAttachmentToAttachment = (localAttachment: LocalAttachment) => {
  const { localMetadata, ...attachment } = localAttachment;

  if (isLocalImageAttachment(localAttachment)) {
    const isRemoteUri = !!attachment.image_url;

    if (isRemoteUri) return attachment as Attachment;

    return {
      ...attachment,
      image_url: localMetadata?.previewUri,
      originalFile: localMetadata.file,
    } as Attachment;
  } else {
    const isRemoteUri = !!attachment.asset_url;
    if (isRemoteUri) return attachment as Attachment;

    return {
      ...attachment,
      asset_url: (localMetadata.file as FileReference).uri,
      originalFile: localMetadata.file,
    } as Attachment;
  }
};

export const createAttachmentsCompositionMiddleware = (
  composer: MessageComposer,
): MessageCompositionMiddleware => ({
  handlers: {
    compose: ({
      state,
      next,
      forward,
    }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      const { attachmentManager } = composer;
      if (!attachmentManager) return forward();

      const attachments = (state.message.attachments ?? []).concat(
        attachmentManager.attachments.map(localAttachmentToAttachment),
      );

      // prevent introducing attachments array into the payload sent to the server
      if (!attachments.length) return forward();

      return next({
        ...state,
        localMessage: {
          ...state.localMessage,
          attachments: [...attachments],
        },
        message: {
          ...state.message,
          attachments: [...attachments],
        },
      });
    },
  },
  id: 'stream-io/message-composer-middleware/attachments',
});

export const createDraftAttachmentsCompositionMiddleware = (
  composer: MessageComposer,
): MessageDraftCompositionMiddleware => ({
  handlers: {
    compose: ({
      state,
      next,
      forward,
    }: MiddlewareHandlerParams<MessageDraftComposerMiddlewareValueState>) => {
      const { attachmentManager } = composer;
      if (!attachmentManager) return forward();

      const attachments = (state.draft.attachments ?? []).concat(
        attachmentManager.attachments.map(localAttachmentToAttachment),
      );

      return next({
        ...state,
        draft: {
          ...state.draft,
          attachments,
        },
      });
    },
  },
  id: 'stream-io/message-composer-middleware/draft-attachments',
});
