import { LocalMessage, StateStore } from 'stream-chat';

export type PendingAttachmentsLoadingState = {
  pendingAttachmentsLoading: Record<string, boolean>;
};

const INITIAL_STATE: PendingAttachmentsLoadingState = {
  pendingAttachmentsLoading: {},
};

export class PendingAttachmentsLoadingStore {
  public store = new StateStore<PendingAttachmentsLoadingState>(INITIAL_STATE);

  constructor() {
    this.store.next({ pendingAttachmentsLoading: {} });
  }

  addPendingAttachment({ message }: { message: LocalMessage }) {
    const attachments = message.attachments ?? [];
    for (const attachment of attachments) {
      const uri = attachment.originalFile?.uri;
      const attachmentId = `${message.id}-${uri}`;
      this.store.next({
        pendingAttachmentsLoading: {
          ...this.store.getLatestValue().pendingAttachmentsLoading,
          [attachmentId]: true,
        },
      });
    }
  }

  removePendingAttachment(attachmentId: string) {
    const pendingAttachmentsLoading = this.store.getLatestValue().pendingAttachmentsLoading;
    delete pendingAttachmentsLoading[attachmentId];
    this.store.next({
      pendingAttachmentsLoading,
    });
  }

  isPendingAttachmentLoading(attachmentId: string) {
    const pendingAttachmentsLoading = this.store.getLatestValue().pendingAttachmentsLoading;
    return pendingAttachmentsLoading[attachmentId] ?? false;
  }
}
