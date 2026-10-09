import type { Channel, ChannelStateData, EditingAuditState } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const supersededBySelector = ({ supersededBy }: ChannelStateData) => ({ supersededBy });
const activeSelector = ({ active }: ChannelStateData) => ({ active });
const editingAuditStateSelector = (state: EditingAuditState) => state;

/**
 * The instance `<Channel>` renders: the one that superseded `channel` (it gets the events from then
 * on), as stream-chat-react's `SupersededChannelSwap` does. It waits while the successor is open
 * elsewhere and this composer isn't empty, as stream-chat only moves a composer into an unused one.
 */
export const useSupersededChannelSwap = <T extends Channel | undefined>(
  channel: T,
): T | Channel => {
  const { supersededBy } = useStateStore(channel?.state, supersededBySelector) ?? {};
  const successorActive = useStateStore(supersededBy?.state, activeSelector)?.active ?? false;
  // re-rendered on every composer change, so the emptiness read below stays current
  useStateStore(channel?.messageComposer.editingAuditState, editingAuditStateSelector);
  const composerIsEmpty = channel?.messageComposer.compositionIsEmpty ?? true;

  if (!supersededBy || (successorActive && !composerIsEmpty)) return channel;
  return supersededBy;
};
