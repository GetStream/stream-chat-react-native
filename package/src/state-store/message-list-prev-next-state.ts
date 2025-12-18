import { LocalMessage, StateStore } from 'stream-chat';

export type MessagePreviousAndNextMessageStoreType = {
  messageList: Record<
    string,
    {
      previousMessage: LocalMessage;
      nextMessage: LocalMessage;
    }
  >;
};

const INITIAL_STATE: MessagePreviousAndNextMessageStoreType = {
  messageList: {},
};

export class MessagePreviousAndNextMessageStore {
  public state: StateStore<MessagePreviousAndNextMessageStoreType>;

  constructor() {
    this.state = new StateStore<MessagePreviousAndNextMessageStoreType>(INITIAL_STATE);
  }

  // The default value of isFlashList is true as the logic in the function makes more sense when the list is not reversed.
  public setMessageListPreviousAndNextMessage({
    messages,
    isFlashList = true,
  }: {
    messages: LocalMessage[];
    isFlashList?: boolean;
  }) {
    const currentValue = this.state.getLatestValue();
    const prevMessageList: MessagePreviousAndNextMessageStoreType['messageList'] =
      currentValue.messageList;
    const newMessageList: MessagePreviousAndNextMessageStoreType['messageList'] = {};
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const previousMessage = isFlashList ? messages[i - 1] : messages[i + 1];
      const nextMessage = isFlashList ? messages[i + 1] : messages[i - 1];

      const existing = prevMessageList[message.id];

      if (
        existing &&
        existing.previousMessage === previousMessage &&
        existing.nextMessage === nextMessage
      ) {
        newMessageList[message.id] = existing;
      } else {
        newMessageList[message.id] = {
          nextMessage,
          previousMessage,
        };
      }
    }
    this.state.partialNext({ messageList: newMessageList });
  }
}
