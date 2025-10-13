import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  compressImage(
    imageURL: string,
    options: {
      base64: boolean;
      compressImageQuality: number;
      format: 'JPEG' | 'PNG' | 'WEBP';
    },
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamChatImageCompress');
