import { useCallback, useEffect, useRef, useState } from 'react';

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

const completed: PendingAttachmentUpload = {
  isUploading: true,
  uploadProgress: 100,
};

const COMPLETION_HOLD_MS = 350;
const COMPLETION_READY_PROGRESS = 90;

const now = () => Date.now();

/**
 * Subscribes to `client.uploadManager` for the pending attachment identified by `localId`.
 */
export function usePendingAttachmentUpload(localId: string | undefined): PendingAttachmentUpload {
  const { client } = useChatContext();
  const [, setRenderTick] = useState(0);
  const completedHoldUntilRef = useRef(0);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastUploadProgressRef = useRef<number | undefined>(undefined);
  const previousLocalIdRef = useRef<string | undefined>(localId);
  const wasUploadingRef = useRef(false);

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
  const isUploading = result?.isUploading ?? false;
  const uploadProgress = result?.uploadProgress;

  if (previousLocalIdRef.current !== localId) {
    previousLocalIdRef.current = localId;
    completedHoldUntilRef.current = 0;
    wasUploadingRef.current = false;
    lastUploadProgressRef.current = undefined;
  }

  let pendingAttachmentUpload = result ?? idle;
  if (localId && isUploading) {
    completedHoldUntilRef.current = 0;
    wasUploadingRef.current = true;
    if (typeof uploadProgress === 'number') {
      lastUploadProgressRef.current = uploadProgress;
    }
  } else if (localId && completedHoldUntilRef.current > now()) {
    pendingAttachmentUpload = completed;
  } else if (localId) {
    const shouldStartCompletionHold =
      wasUploadingRef.current &&
      typeof lastUploadProgressRef.current === 'number' &&
      lastUploadProgressRef.current >= COMPLETION_READY_PROGRESS;

    wasUploadingRef.current = false;
    lastUploadProgressRef.current = undefined;

    if (shouldStartCompletionHold) {
      completedHoldUntilRef.current = now() + COMPLETION_HOLD_MS;
      pendingAttachmentUpload = completed;
    } else {
      completedHoldUntilRef.current = 0;
    }
  } else {
    completedHoldUntilRef.current = 0;
    wasUploadingRef.current = false;
    lastUploadProgressRef.current = undefined;
  }

  useEffect(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = undefined;
    }

    const holdForMs = completedHoldUntilRef.current - now();
    if (holdForMs <= 0) {
      return;
    }

    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = undefined;
      setRenderTick((tick) => tick + 1);
    }, holdForMs);
  }, [localId, pendingAttachmentUpload]);

  useEffect(
    () => () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    },
    [],
  );

  return pendingAttachmentUpload;
}
