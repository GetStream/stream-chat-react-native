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

  public setMessageListPreviousAndNextMessage(messages: LocalMessage[]) {
    const currentValue = this.state.getLatestValue();
    const messageList: MessagePreviousAndNextMessageStoreType['messageList'] =
      currentValue.messageList;
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const previousMessage = messages[i - 1];
      const nextMessage = messages[i + 1];
      messageList[message.id] = {
        nextMessage,
        previousMessage,
      };
    }
    this.state.partialNext({ messageList });
  }
}
