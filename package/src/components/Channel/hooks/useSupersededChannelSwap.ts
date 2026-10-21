import type { Channel, ChannelStateData, EditingAuditState } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const supersededBySelector = ({ supersededBy }: ChannelStateData) => ({ supersededBy });
const activeSelector = ({ active }: ChannelStateData) => ({ active });
const editingAuditStateSelector = (state: EditingAuditState) => state;

/**
 * The instance `<Channel>` renders: the one that superseded `channel`, which receives the events
 * from then on. The swap waits while the successor is open elsewhere and this composer is not
 * empty, as stream-chat only moves a composer into an unused instance.
 *
 * @param channel The channel, or `undefined` without one.
 * @returns The successor when it supersedes `channel` and the swap is not waiting, else `channel`.
 */
export const useSupersededChannelSwap = <T extends Channel | undefined>(
  channel: T,
): T | Channel => {
  const { supersededBy } = useStateStore(channel?.state, supersededBySelector) ?? {};
  const successorActive = useStateStore(supersededBy?.state, activeSelector)?.active ?? false;
  // Re-renders on every composer change so the emptiness read below stays current.
  useStateStore(channel?.messageComposer.editingAuditState, editingAuditStateSelector);
  const composerIsEmpty = channel?.messageComposer.compositionIsEmpty ?? true;

  if (!supersededBy || (successorActive && !composerIsEmpty)) return channel;
  return supersededBy;
};
