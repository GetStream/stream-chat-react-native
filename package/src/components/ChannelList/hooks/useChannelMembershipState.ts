import { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';

import { useSelectedChannelState } from '../../../hooks/useSelectedChannelState';

import { DefaultStreamChatGenerics } from '../../../types/types';

const selector = <StreamChatGenerics extends DefaultStreamChatGenerics>(
  channel: Channel<StreamChatGenerics>,
) => channel.state.membership;
const keys: EventTypes[] = ['member.updated'];

export function useChannelMembershipState<StreamChatGenerics extends DefaultStreamChatGenerics>(
  channel: Channel<StreamChatGenerics>,
): ChannelMemberResponse<StreamChatGenerics>;
export function useChannelMembershipState<StreamChatGenerics extends DefaultStreamChatGenerics>(
  channel?: Channel<StreamChatGenerics>,
): ChannelMemberResponse<StreamChatGenerics> | undefined;
export function useChannelMembershipState<StreamChatGenerics extends DefaultStreamChatGenerics>(
  channel?: Channel<StreamChatGenerics>,
) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
