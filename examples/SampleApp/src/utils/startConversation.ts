import { localMessageToNewMessagePayload } from 'stream-chat';
import type { Channel, OperationRequestFn, StreamChat } from 'stream-chat';

/**
 * A conversation with `memberIds` that exists only in this client until its first message: a
 * channel created from its members, without an id, so it's provisional (`Channel.isProvisional`).
 * If the client already has a loaded conversation created from exactly these members,
 * `client.channel()` returns that one instead.
 */
export const startLocalConversation = (client: StreamChat, memberIds: string[]): Channel => {
  const channel = client.channel('messaging', {
    members: memberIds.map((user_id) => ({ user_id })),
  });
  if (!channel.isProvisional || channel.messagePaginator.hasResults) {
    return channel;
  }
  // Nothing is loaded for a channel the server doesn't have yet, so an empty first page, shorter
  // than a page, makes the message list show its empty state with nothing older to load.
  channel.messagePaginator.placeExternalQueryPage([], channel.messagePaginator.pageSize);
  return channel;
};

/**
 * Sends the first message of a provisional channel. `Channel.watch()` creates the channel on the
 * server and resolves with the instance to use from then on, which is this one, or the one that
 * superseded it when the client already had the channel under its real cid. Messages in every
 * other channel are sent the usual way.
 */
export const createOnFirstSend =
  (client: StreamChat): OperationRequestFn<'send'> =>
  async (params, defaultRequest) => {
    const channel = client.channelManager.get(params.localMessage.cid);
    if (!channel?.isProvisional) {
      return defaultRequest(params);
    }

    const created = await channel.watch();
    // Shows the new channel in the channel lists whose filters it matches.
    client.channelManager.ingestChannel(created);

    const { message } = await created.sendMessage({
      message: params.message ?? localMessageToNewMessagePayload(params.localMessage),
      ...params.options,
    });
    return { message };
  };
