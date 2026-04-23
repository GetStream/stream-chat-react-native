import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export type UploadHeader = {
  name: string;
  value: string;
};

export type UploadPart = {
  fieldName: string;
  fileName?: string;
  kind: string;
  mimeType?: string;
  uri?: string;
  value?: string;
};

export type UploadProgressConfig = {
  count?: number;
  intervalMs?: number;
};

export type UploadProgressEvent = {
  loaded: number;
  total?: number;
  uploadId: string;
};

export type UploadResponse = {
  body: string;
  headers?: ReadonlyArray<UploadHeader>;
  status: number;
  statusText?: string;
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
    progress?: UploadProgressConfig,
    timeoutMs?: number | null,
  ): Promise<UploadResponse>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamMultipartUploader');
