import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export type VideoThumbnailResult = {
  error?: string | null;
  uri?: string | null;
};

export interface Spec extends TurboModule {
  createVideoThumbnails(urls: ReadonlyArray<string>): Promise<ReadonlyArray<VideoThumbnailResult>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamVideoThumbnail');
