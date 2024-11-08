import { PollState } from 'stream-chat';

import { usePollContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';

export const usePollStateStore = <
  T extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (nextValue: PollState) => T,
): T => {
  const { poll } = usePollContext();
  return useStateStore(poll.state, selector);
};
