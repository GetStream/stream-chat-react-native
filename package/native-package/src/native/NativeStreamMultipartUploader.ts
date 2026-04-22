import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export type UploadHeader = {
  name: string;
  value: string;
};

export type UploadPart = {
  fieldName: string;
  fileName?: string | null;
  kind: string;
  mimeType?: string | null;
  uri?: string | null;
  value?: string | null;
};

export type UploadProgressConfig = {
  count?: number | null;
  intervalMs?: number | null;
};

export type UploadProgressEvent = {
  loaded: number;
  total?: number | null;
  uploadId: string;
};

export type UploadResponse = {
  body: string;
  headers?: ReadonlyArray<UploadHeader> | null;
  status: number;
  statusText?: string | null;
};

export interface Spec extends TurboModule {
  addListener(eventType: string): void;
  cancelUpload(uploadId: string): Promise<void>;
  removeListeners(count: number): void;
  uploadMultipart(
    uploadId: string,
    url: string,
    method: string,
    headers: ReadonlyArray<UploadHeader>,
    parts: ReadonlyArray<UploadPart>,
    progress?: UploadProgressConfig | null,
    timeoutMs?: number | null,
  ): Promise<UploadResponse>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamMultipartUploader');
