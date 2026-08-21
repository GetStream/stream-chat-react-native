import type { Channel, ChannelResponse } from 'stream-chat';

/**
 * Narrows a `Channel` instance to the response-shaped object the event dispatchers want.
 *
 * Tests routinely have a real `Channel` in hand and pass it straight into a dispatcher, which used to
 * type-check by accident: `Channel` was structurally assignable to `Partial<ChannelResponse>`. It no
 * longer is, because `channel.config` is now the channel's *resolved* `ChannelConfig` while
 * `ChannelResponse.config` is the server's `ChannelConfigWithInfo` — same property name, different type.
 *
 * The dispatchers only ever read `cid` / `id` / `type` off this argument, so projecting those three (over
 * whatever `channel.data` carries) is both sufficient and closer to a real WS payload than handing the
 * live instance to `dispatchEvent`.
 */
export const toChannelResponse = (
  channel: Channel | Partial<ChannelResponse>,
): Partial<ChannelResponse> => {
  // `getClient` duck-types a `Channel` apart from a plain response object. It replaces `getConfig`,
  // which used to serve this purpose and no longer exists.
  if (typeof (channel as Channel).getClient !== 'function') {
    return channel as Partial<ChannelResponse>;
  }

  const instance = channel as Channel;
  return {
    ...instance.data,
    cid: instance.cid,
    id: instance.id,
    type: instance.type,
  } as Partial<ChannelResponse>;
};
