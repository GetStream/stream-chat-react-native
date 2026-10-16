import { useStateStore } from '@stream-io/state-store/react-bindings';

import type { AbstractMediaPickerService } from '../AbstractMediaPickerService';
import { type MediaPickerState } from '../AbstractMediaPickerService';

export const selector = (nextState: MediaPickerState) => ({
  attachments: nextState.assets,
});

export const useMediaPickerState = ({
  service,
}: {
  service: AbstractMediaPickerService | undefined;
}) => useStateStore(service?.state, selector);
