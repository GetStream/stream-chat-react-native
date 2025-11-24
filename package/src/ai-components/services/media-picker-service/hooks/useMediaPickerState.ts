import {
  AbstractMediaPickerService,
  type MediaPickerState,
} from '../AbstractMediaPickerService.ts';
import { useStateStore } from '@stream-io/state-store/react-bindings';

export const selector = (nextState: MediaPickerState) => ({
  attachments: nextState.assets,
});

export const useMediaPickerState = ({
  service,
}: {
  service: AbstractMediaPickerService | undefined;
}) => useStateStore(service?.state, selector);
