import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  createVideoThumbnails(urls: ReadonlyArray<string>): Promise<ReadonlyArray<string>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamVideoThumbnail');
