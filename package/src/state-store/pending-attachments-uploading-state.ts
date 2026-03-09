import { LocalMessage, StateStore } from 'stream-chat';

export type PendingAttachmentsUploadingState = {
  pendingAttachmentsUploading: Record<string, boolean>;
};

const INITIAL_STATE: PendingAttachmentsUploadingState = {
  pendingAttachmentsUploading: {},
};

export class PendingAttachmentsUploadingStateStore {
  public store = new StateStore<PendingAttachmentsUploadingState>(INITIAL_STATE);

  constructor() {
    this.store.next({ pendingAttachmentsUploading: {} });
  }

  addPendingAttachment({ message }: { message: LocalMessage }) {
    const attachments = message.attachments ?? [];
    for (const attachment of attachments) {
      const uri = attachment.originalFile?.uri;
      const attachmentId = `${message.id}-${uri}`;
      this.store.next({
        pendingAttachmentsUploading: {
          ...this.store.getLatestValue().pendingAttachmentsUploading,
          [attachmentId]: true,
        },
      });
    }
  }

  removePendingAttachment(attachmentId: string) {
    const pendingAttachmentsUploading = this.store.getLatestValue().pendingAttachmentsUploading;
    delete pendingAttachmentsUploading[attachmentId];
    this.store.next({
      pendingAttachmentsUploading,
    });
  }

  isPendingAttachmentUploading(attachmentId: string) {
    const pendingAttachmentsUploading = this.store.getLatestValue().pendingAttachmentsUploading;
    return pendingAttachmentsUploading[attachmentId] ?? false;
  }
}
