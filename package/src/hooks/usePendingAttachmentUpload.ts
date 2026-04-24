import { useCallback } from 'react';

import type { UploadManagerState } from 'stream-chat';

import { useStateStore } from './useStateStore';

import { useChatContext } from '../contexts/chatContext/ChatContext';

export type PendingAttachmentUpload = {
  /** True when `client.uploadManager` has an in-flight upload for this attachment local id. */
  isUploading: boolean;
  /**
   * Upload percent **0–100** from `client.uploadManager` (same scale as `attachmentManager`
   * `onProgress` / `localMetadata.uploadProgress`). `undefined` when not computable or not uploading.
   */
  uploadProgress: number | undefined;
};

const idle: PendingAttachmentUpload = {
  isUploading: false,
  uploadProgress: undefined,
};

/**
 * Subscribes to `client.uploadManager` for the pending attachment identified by `localId`.
 */
export function usePendingAttachmentUpload(localId: string | undefined): PendingAttachmentUpload {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: UploadManagerState): PendingAttachmentUpload => {
      if (!localId) {
        return idle;
      }
      const record = state.uploads[localId];
      if (!record) {
        return idle;
      }
      return {
        isUploading: true,
        uploadProgress: record.uploadProgress,
      };
    },
    [localId],
  );

  const result = useStateStore(localId ? client.uploadManager.state : undefined, selector);

  return result ?? idle;
}
