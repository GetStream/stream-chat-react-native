import { useEffect } from 'react';

import {
  Channel,
  ChannelConfig,
  LocalMessage,
  MessageRequest as Message,
  SendMessageAPIResponse,
  SendMessageOptions,
} from 'stream-chat';

type RequestHandlers = NonNullable<ChannelConfig['requestHandlers']>;

export type ChannelRequestHandlersParams = {
  channel: Channel;
  /**
   * Awaits any in-flight attachment uploads for the outgoing message and swaps its local preview
   * URLs for the resolved CDN URLs. Invoked by the always-registered send handler, inside the
   * stream-chat send pipeline (after the optimistic ingest, before the POST).
   */
  uploadPendingAttachments?: (message: LocalMessage) => Promise<void>;
  /** Overrides the default send/retry request. Mirrors the `<Channel doSendMessageRequest>` prop. */
  doSendMessageRequest?: (
    channelId: string,
    message: Message,
    options?: SendMessageOptions,
  ) => Promise<SendMessageAPIResponse>;
};

/**
 * Registers message-request handlers into `channel.configState.requestHandlers` so the `stream-chat`
 * message-operations engine (`channel.sendMessageWithLocalUpdate` / `retrySendMessageWithLocalUpdate`
 * / `updateMessageWithLocalUpdate`) honors them.
 *
 * Only the send/retry pair is managed here, and it is registered unconditionally because it also drives
 * the attachment-upload step (see `uploadPendingAttachments`); it defers the actual POST to the
 * integrator's `doSendMessageRequest` when provided, and otherwise to `channel.sendMessage` (the client
 * default).
 *
 * `markReadRequest`, `updateMessageRequest` and `deleteMessageRequest` are **not** managed here — those
 * are registered declaratively through `client.config.set({ channel: { requestHandlers } })` and the LLC
 * resolves them per instance. The `<Channel doMarkReadRequest>` / `doUpdateMessageRequest` props that
 * used to feed them are removed.
 *
 * Nothing this hook does not own is deleted from the slot map, which matters: `delete`-ing a handler it
 * merely *might* own is what silently dropped a declaratively-registered one, sending the operation down
 * the LLC's default path — an unmocked request that simply hangs.
 *
 * Re-applied whenever the channel re-derives its configuration. `Channel.initializeConfig` *replaces*
 * `requestHandlers` from the declarative tree rather than merging into it, and it runs on every change
 * to the `channel`, `messagePaginator` or `messageOperations` keys (a `Channel` declares the latter two
 * as `alsoWatch`). A write made here is not one of those inputs, so any `client.config.set()` touching
 * them would otherwise drop our send handler — and with it the attachment-upload step, silently. The
 * subscription below is the re-apply the LLC's `initializeConfig` doc asks direct writers to perform.
 */
export const useChannelRequestHandlers = ({
  channel,
  uploadPendingAttachments,
  doSendMessageRequest,
}: ChannelRequestHandlersParams) => {
  useEffect(() => {
    // `configState` is a getter on `Channel.prototype` now (it delegates to the channel's
    // `ConfigController`), where it used to be an own field. A spread copy of a channel — which tests
    // and integrator code both make — therefore no longer carries it, so this cannot be assumed.
    const configState = channel?.configState;
    if (!configState) return;

    // Always register a send handler. It runs INSIDE the stream-chat send pipeline — after the
    // optimistic ingest (the message already shows as pending), before the POST — so it is where we
    // await any in-flight attachment uploads and swap local preview URLs for CDN URLs. When the
    // integrator supplied doSendMessageRequest we defer the actual POST to it; otherwise we fall back
    // to channel.sendMessage, which is byte-identical to the client default for messages with no
    // pending uploads. retrySendMessageRequest reuses it, so retries re-await uploads too.
    //
    // Built once per effect run rather than inside `applyRequestHandlers`, so its identity is stable
    // across re-applies — that identity is what the subscription below uses to tell "still ours" from
    // "dropped by a re-derivation".
    const sendMessageRequest: RequestHandlers['sendMessageRequest'] = async ({
      localMessage,
      message,
      options,
    }) => {
      await uploadPendingAttachments?.(localMessage);

      if (doSendMessageRequest) {
        const response = await doSendMessageRequest(channel.cid, message as Message, options);
        if (response?.message) {
          return { message: response.message };
        }
      }

      const fallback = await channel.sendMessage({ message: message as Message, ...options });
      return { message: fallback.message };
    };

    const applyRequestHandlers = () => {
      const currentRequestHandlers = configState.getLatestValue().requestHandlers;
      const nextRequestHandlers: RequestHandlers = { ...(currentRequestHandlers ?? {}) };

      // Only the send/retry pair is ours. `markReadRequest`, `updateMessageRequest` and
      // `deleteMessageRequest` are left untouched so a handler registered through
      // `client.config.set({ channel: { requestHandlers } })` survives — deleting them here is what
      // used to drop an integrator's declaratively-registered handler on the floor.
      delete nextRequestHandlers.retrySendMessageRequest;
      delete nextRequestHandlers.sendMessageRequest;

      nextRequestHandlers.sendMessageRequest = sendMessageRequest;
      nextRequestHandlers.retrySendMessageRequest = sendMessageRequest;

      configState.partialNext({
        requestHandlers:
          Object.keys(nextRequestHandlers).length > 0 ? nextRequestHandlers : undefined,
      });
    };

    applyRequestHandlers();

    // Subscribed after the first apply, so the immediate replay `subscribe` performs already sees our
    // handler and short-circuits. Our own `partialNext` re-enters here for the same reason, so there is
    // no write loop: the guard is satisfied by the write that triggered it.
    return configState.subscribe(({ requestHandlers }) => {
      if (requestHandlers?.sendMessageRequest === sendMessageRequest) return;
      applyRequestHandlers();
    });
  }, [channel, uploadPendingAttachments, doSendMessageRequest]);
};
