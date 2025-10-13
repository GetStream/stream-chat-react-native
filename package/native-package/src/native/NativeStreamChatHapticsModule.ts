import type { TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  notificationFeedback(type: 'success' | 'warning' | 'error'): void;
  impactFeedback(type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'): void;
  selectionFeedback(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamChatHapticsModule');
