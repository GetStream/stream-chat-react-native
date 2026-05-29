import type React from 'react';

import type { MinimumUploadRequestResult } from 'stream-chat';

import type { IconProps } from '../../icons';
import type { File } from '../../types/types';

export type ActionOptions = {
  onSuccess?: () => unknown;
};

/**
 * Override the file upload request used to upload the channel image.
 * By default the SDK uploads to Stream's CDN via `client.uploadImage`.
 * @param file File object to upload
 */
export type DoFileUploadRequest = (file: File) => Promise<MinimumUploadRequestResult>;

export type ActionHandler = (options?: ActionOptions) => Promise<void>;

export type ActionItem<TId extends string = string> = {
  action: ActionHandler;
  Icon: React.ComponentType<IconProps>;
  id: TId;
  label: string;
  type: 'destructive' | 'standard';
};
