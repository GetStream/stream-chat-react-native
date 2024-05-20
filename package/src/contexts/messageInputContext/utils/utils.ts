import { lookup } from 'mime-types';
import type { FileUploadConfig } from 'stream-chat';

import { Asset, File } from '../../../types/types';

export const MAX_FILE_SIZE_TO_UPLOAD = 100 * 1024 * 1024; // 100 MB

type CheckUploadPermissionsParams = {
  config: FileUploadConfig;
  file: File | Partial<Asset>;
};

/**
 * This utility function checks if the file upload is allowed based on the file upload config.
 * @param Object File upload config and file to check
 * @returns
 */
export const isUploadAllowed = ({ config, file }: CheckUploadPermissionsParams) => {
  const {
    allowed_file_extensions,
    allowed_mime_types,
    blocked_file_extensions,
    blocked_mime_types,
  } = config;

  if (allowed_file_extensions?.length) {
    const allowed = allowed_file_extensions.some((fileExtension: string) =>
      file.name?.toLowerCase().endsWith(fileExtension.toLowerCase()),
    );

    if (!allowed) {
      return false;
    }
  }

  if (blocked_file_extensions?.length) {
    const blocked = blocked_file_extensions.some((fileExtension: string) =>
      file.name?.toLowerCase().endsWith(fileExtension.toLowerCase()),
    );

    if (blocked) {
      return false;
    }
  }

  if (allowed_mime_types?.length) {
    if (file.name) {
      const fileMimeType = lookup(file.name) as string;
      const allowed = allowed_mime_types.some(
        (mimeType: string) => fileMimeType.toLowerCase() === mimeType.toLowerCase(),
      );

      if (!allowed) {
        return false;
      }
    }
  }

  if (blocked_mime_types?.length) {
    if (file.name) {
      const fileMimeType = lookup(file.name) as string;
      const blocked = blocked_mime_types.some(
        (mimeType: string) => fileMimeType.toLowerCase() === mimeType.toLowerCase(),
      );

      if (blocked) {
        return false;
      }
    }
  }

  return true;
};

/**
 * This utility function prettifies the file size.
 * @param bytes The bytes of the file
 * @param precision The precision to which the file size should be rounded
 * @returns
 */
export function prettifyFileSize(bytes: number, precision = 3) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const mantissa = bytes / 1024 ** exponent;
  return `${mantissa.toPrecision(precision)} ${units[exponent]}`;
}
