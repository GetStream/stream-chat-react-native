import { Robot } from './Robot';

import type { AttachmentType, ReactionType } from '../mock-server/DataTypes';
import type { MockServer } from '../mock-server/MockServer';

const MULTIPLE_MESSAGES_INTERVAL_MS = 300;

const quoteParam = (last: boolean) => (last ? 'quote_last=true' : 'quote_first=true');

/** Acts as the other channel member (`count_dooku`) through the mock server's participant endpoints. */
export class ParticipantRobot extends Robot {
  static readonly userName = 'Count Dooku';
  static readonly userId = 'count_dooku';

  constructor(private readonly mockServer: MockServer) {
    super();
  }

  startTyping(): this {
    return this.post('participant/typing/start');
  }

  startTypingInThread(): this {
    return this.post('participant/typing/start?thread=true');
  }

  stopTyping(): this {
    return this.post('participant/typing/stop');
  }

  stopTypingInThread(): this {
    return this.post('participant/typing/stop?thread=true');
  }

  readMessage(): this {
    return this.post('participant/read');
  }

  /** Marks the newest message as delivered to the participant (`message.delivered`). */
  markMessagesDelivered(): this {
    return this.post('participant/delivered');
  }

  sendMessage(text: string, delay = 0): this {
    return this.post(
      delay > 0 ? `participant/message?delay=${delay}` : 'participant/message',
      text,
    );
  }

  /** Sends `count` messages named `${text}-1` through `${text}-${count}`, 300ms apart. */
  sendMultipleMessages(text: string, count: number): this {
    for (let index = 1; index <= count; index++) {
      this.sendMessage(`${text}-${index}`).sleep(MULTIPLE_MESSAGES_INTERVAL_MS);
    }
    return this;
  }

  sendMessageInThread(text: string, alsoSendInChannel = false): this {
    return this.post(
      `participant/message?thread=true&thread_and_channel=${alsoSendInChannel}`,
      text,
    );
  }

  editMessage(text: string): this {
    return this.post('participant/message?action=edit', text);
  }

  deleteMessage(hard = false): this {
    return this.post(`participant/message?action=delete&hard_delete=${hard}`);
  }

  quoteMessage(text: string, last = true): this {
    return this.post(`participant/message?${quoteParam(last)}`, text);
  }

  quoteMessageInThread(text: string, alsoSendInChannel = false, last = true): this {
    return this.post(
      `participant/message?${quoteParam(last)}&thread=true&thread_and_channel=${alsoSendInChannel}`,
      text,
    );
  }

  uploadGiphy(): this {
    return this.post('participant/message?giphy=true');
  }

  uploadGiphyInThread(): this {
    return this.post('participant/message?giphy=true&thread=true');
  }

  quoteMessageWithGiphy(last = true): this {
    return this.post(`participant/message?giphy=true&${quoteParam(last)}`);
  }

  quoteMessageWithGiphyInThread(alsoSendInChannel = false, last = true): this {
    return this.post(
      `participant/message?giphy=true&${quoteParam(last)}&thread=true&thread_and_channel=${alsoSendInChannel}`,
    );
  }

  pinMessage(): this {
    return this.post('participant/message?action=pin');
  }

  unpinMessage(): this {
    return this.post('participant/message?action=unpin');
  }

  uploadAttachment(type: AttachmentType, count = 1): this {
    return this.post(`participant/message?${type}=${count}`);
  }

  quoteMessageWithAttachment(type: AttachmentType, count = 1, last = true): this {
    return this.post(`participant/message?${quoteParam(last)}&${type}=${count}`);
  }

  uploadAttachmentInThread(type: AttachmentType, count = 1, alsoSendInChannel = false): this {
    return this.post(
      `participant/message?${type}=${count}&thread=true&thread_and_channel=${alsoSendInChannel}`,
    );
  }

  quoteMessageWithAttachmentInThread(
    type: AttachmentType,
    count = 1,
    alsoSendInChannel = false,
    last = true,
  ): this {
    return this.post(
      `participant/message?${quoteParam(last)}&${type}=${count}&thread=true&thread_and_channel=${alsoSendInChannel}`,
    );
  }

  /** Votes for `option` in the poll of the newest poll message. */
  castPollVote(option: string): this {
    return this.post(`participant/poll_vote?option=${encodeURIComponent(option)}`);
  }

  /** Adds an answer (comment) to the poll of the newest poll message. */
  addPollAnswer(answer: string): this {
    return this.post(`participant/poll_vote?answer=${encodeURIComponent(answer)}`);
  }

  addReaction(type: ReactionType, delay = 0): this {
    return this.post(
      delay > 0
        ? `participant/reaction?type=${type}&delay=${delay}`
        : `participant/reaction?type=${type}`,
    );
  }

  deleteReaction(type: ReactionType): this {
    return this.post(`participant/reaction?type=${type}&delete=true`);
  }

  private post(endpoint: string, body?: string): this {
    return this.perform(() => this.mockServer.postRequest(endpoint, body));
  }
}
