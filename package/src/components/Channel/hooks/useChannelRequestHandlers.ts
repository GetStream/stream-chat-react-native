import { useEffect } from 'react';

import type {
  Channel,
  ChannelInstanceConfig,
  Message,
  SendMessageAPIResponse,
  SendMessageOptions,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

type RequestHandlers = NonNullable<ChannelInstanceConfig['requestHandlers']>;

export type ChannelRequestHandlersParams = {
  channel: Channel;
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
 * Registers the integrator's custom message-request overrides into
 * `channel.configState.requestHandlers` so the `stream-chat` message-operations engine
 * (`channel.sendMessageWithLocalUpdate` / `retrySendMessageWithLocalUpdate` /
 * `updateMessageWithLocalUpdate`) honors them.
 *
 * The handlers this hook manages are (re)written whenever the channel or an override
 * changes; overrides that are not provided are cleared so the client defaults apply.
 * Delete and mark-read are intentionally left to the client default / the mark-read flow.
 */
export const useChannelRequestHandlers = ({
  channel,
  doMarkReadRequest,
  doSendMessageRequest,
  doUpdateMessageRequest,
}: ChannelRequestHandlersParams) => {
  useEffect(() => {
    const currentRequestHandlers = channel.configState.getLatestValue().requestHandlers;
    const nextRequestHandlers: RequestHandlers = { ...(currentRequestHandlers ?? {}) };

    // Reset the handlers this hook manages, then register only the provided overrides.
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

    if (doSendMessageRequest) {
      const sendMessageRequest: RequestHandlers['sendMessageRequest'] = async ({
        message,
        options,
      }) => {
        const response = await doSendMessageRequest(channel.cid, message as Message, options);
        if (response?.message) {
          return { message: response.message };
        }
        const fallback = await channel.sendMessage(message as Message, options);
        return { message: fallback.message };
      };

      nextRequestHandlers.sendMessageRequest = sendMessageRequest;
      nextRequestHandlers.retrySendMessageRequest = sendMessageRequest;
    }

    if (doUpdateMessageRequest) {
      nextRequestHandlers.updateMessageRequest = async ({ localMessage, options }) => ({
        message: (await doUpdateMessageRequest(channel.cid, localMessage, options)).message,
      });
    }

    channel.configState.partialNext({
      requestHandlers:
        Object.keys(nextRequestHandlers).length > 0 ? nextRequestHandlers : undefined,
    });
  }, [channel, doMarkReadRequest, doSendMessageRequest, doUpdateMessageRequest]);
};
