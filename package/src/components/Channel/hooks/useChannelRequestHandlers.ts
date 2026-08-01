import { useEffect } from 'react';

import {
  Channel,
  ChannelInstanceConfig,
  LocalMessage,
  localMessageToNewMessagePayload,
  MessageRequest as Message,
  SendMessageAPIResponse,
  SendMessageOptions,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

type RequestHandlers = NonNullable<ChannelInstanceConfig['requestHandlers']>;

export type ChannelRequestHandlersParams = {
  channel: Channel;
  /**
   * Awaits any in-flight attachment uploads for the outgoing message and swaps its local preview
   * URLs for the resolved CDN URLs. Invoked by the always-registered send handler, inside the
   * stream-chat send pipeline (after the optimistic ingest, before the POST).
   */
  uploadPendingAttachments?: (message: LocalMessage) => Promise<void>;
  /** Overrides the default mark-read request. Mirrors the `<Channel doMarkReadRequest>` prop. */
  doMarkReadRequest?: (channel: Channel) => void;
  /** Overrides the default send/retry request. Mirrors the `<Channel doSendMessageRequest>` prop. */
  doSendMessageRequest?: (
    channelId: string,
    message: Message,
    options?: SendMessageOptions,
  ) => Promise<SendMessageAPIResponse>;
  /** Overrides the default update request. Mirrors the `<Channel doUpdateMessageRequest>` prop. */
  doUpdateMessageRequest?: (
    channelId: string,
    updatedMessage: Parameters<StreamChat['updateMessage']>[0],
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
};

/**
 * Registers message-request handlers into `channel.configState.requestHandlers` so the `stream-chat`
 * message-operations engine (`channel.sendMessageWithLocalUpdate` / `retrySendMessageWithLocalUpdate`
 * / `updateMessageWithLocalUpdate`) honors them.
 *
 * The handlers this hook manages are (re)written whenever the channel or an input changes. The send
 * handler is registered unconditionally because it also drives the attachment-upload step (see
 * `uploadPendingAttachments`); it defers the actual POST to the integrator's `doSendMessageRequest`
 * when provided, and otherwise to `channel.sendMessage` (the client default). The update override is
 * registered only when provided; delete and mark-read are left to the client default / mark-read flow.
 */
export const useChannelRequestHandlers = ({
  channel,
  uploadPendingAttachments,
  doMarkReadRequest,
  doSendMessageRequest,
  doUpdateMessageRequest,
}: ChannelRequestHandlersParams) => {
  useEffect(() => {
    const currentRequestHandlers = channel.configState.getLatestValue().requestHandlers;
    const nextRequestHandlers: RequestHandlers = { ...(currentRequestHandlers ?? {}) };

    // Reset the handlers this hook manages, then re-register: the send/retry handler unconditionally
    // (it also drives attachment uploads), and mark-read / update only when their override is provided.
    delete nextRequestHandlers.markReadRequest;
    delete nextRequestHandlers.retrySendMessageRequest;
    delete nextRequestHandlers.sendMessageRequest;
    delete nextRequestHandlers.updateMessageRequest;

    if (doMarkReadRequest) {
      // RN's doMarkReadRequest performs the custom mark-read itself (returns void); its obsolete 2nd
      // (setChannelUnreadUiState) arg is dropped now that unread state is the paginator snapshot.
      nextRequestHandlers.markReadRequest = ({ channel: markReadChannel }) => {
        doMarkReadRequest(markReadChannel);
        return Promise.resolve(null);
      };
    }

    // Always register a send handler. It runs INSIDE the stream-chat send pipeline — after the
    // optimistic ingest (the message already shows as pending), before the POST — so it is where we
    // await any in-flight attachment uploads and swap local preview URLs for CDN URLs. When the
    // integrator supplied doSendMessageRequest we defer the actual POST to it; otherwise we fall back
    // to channel.sendMessage, which is byte-identical to the client default for messages with no
    // pending uploads. retrySendMessageRequest reuses it, so retries re-await uploads too.
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

    nextRequestHandlers.sendMessageRequest = sendMessageRequest;
    nextRequestHandlers.retrySendMessageRequest = sendMessageRequest;

    if (doUpdateMessageRequest) {
      nextRequestHandlers.updateMessageRequest = async ({ localMessage, options }) => ({
        message: (
          await doUpdateMessageRequest(
            channel.cid,
            { id: localMessage.id, message: localMessageToNewMessagePayload(localMessage) },
            options,
          )
        ).message,
      });
    }

    channel.configState.partialNext({
      requestHandlers:
        Object.keys(nextRequestHandlers).length > 0 ? nextRequestHandlers : undefined,
    });
  }, [
    channel,
    uploadPendingAttachments,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
  ]);
};
