import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  createResizedImage(
    uri: string,
    width: number,
    height: number,
    format: string,
    quality: number,
    mode: string,
    onlyScaleDown: boolean,
    rotation?: number,
    outputPath?: string | null,
    keepMeta?: boolean,
  ): Promise<{
    base64: string;
    height: number;
    name: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamChatReactNative');
