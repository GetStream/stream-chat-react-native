import 'stream-chat';
import { Asset, File } from './types';

declare module 'stream-chat' {
  interface CustomUserData {
    image?: string;
  }

  interface CustomChannelData {
    [key: string]: unknown;

    image?: string;
  }

  interface CustomAttachmentData {
    duration?: number;
    file_size?: number;
    mime_type?: string;
    originalFile?: File;
    originalImage?: Partial<Asset>;
    waveform_data?: number[];
  }

  interface CustomCommandData {
    flag: unknown;
    imgur: unknown;
  }
}
