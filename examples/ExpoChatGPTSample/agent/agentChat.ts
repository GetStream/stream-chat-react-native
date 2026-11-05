import { LiveReasoning, type Session } from '@stream-io/calypso';
import { type Channel, type Event, type LocalMessage, StateStore } from 'stream-chat';

/** How many messages are read at a time. */
const PAGE_SIZE = 30;

export type AgentChatState = {
  /** The channel's messages, oldest first. */
  messages: readonly LocalMessage[];
  /** Whether the channel holds messages older than those loaded. */
  hasOlderMessages: boolean;
  /** Whether the first page of messages is in. */
  isLoaded: boolean;
};

/**
 * A written conversation as the AI components want it: the messages of the channel the router
 * keeps it in, and the whole of each reply's thinking.
 *
 * The router writes everything there. Asking goes through the session, which records the question
 * in the channel and answers it there: the reply's text, and its steps (each round of reasoning and
 * each tool call) as attachments.
 */
export class AgentChat {
  /** Each reply's thinking in full, from its live updates. A stored step only keeps its opening. */
  readonly reasoning = new LiveReasoning();

  /** Whether the person asked something here, which may not have arrived in `messages` yet. */
  wasAsked = false;

  readonly state = new StateStore<AgentChatState>({
    hasOlderMessages: false,
    isLoaded: false,
    messages: [],
  });

  private stops: (() => void)[] = [];

  constructor(
    readonly session: Session,
    readonly channel: Channel,
  ) {}

  /** Watches the channel and loads its latest messages. */
  async follow() {
    // Every event rather than the list kept for us: each live update carries its own window of the
    // reply's thinking, and folding them into one would lose all but the last.
    const subscription = this.channel.on((event: Event) => {
      if (event.type === 'message.updated' && event.message) {
        this.reasoning.read(event.message as { id: string; reasoning?: unknown });
      }
      if (
        event.type === 'message.new' ||
        event.type === 'message.updated' ||
        event.type === 'message.deleted'
      ) {
        // A new array, in which only the messages that changed are new objects.
        this.state.partialNext({ messages: [...this.channel.state.messages] });
      }
    });
    this.stops.push(() => subscription.unsubscribe());

    const recovered = this.channel
      .getClient()
      .on('connection.recovered', () => void this.watchLatest().catch(() => {}));
    this.stops.push(() => recovered.unsubscribe());

    await this.watchLatest();
  }

  /** Watches the channel again and takes its latest page, in place of what was loaded. */
  private async watchLatest() {
    const watched = await this.channel.watch({ messages: { limit: PAGE_SIZE } });
    this.state.partialNext({
      hasOlderMessages: (watched.messages?.length ?? 0) >= PAGE_SIZE,
      isLoaded: true,
      messages: [...this.channel.state.messages],
    });
  }

  /** Loads the messages before the oldest one loaded. Throws when it can't, to be asked again. */
  loadOlderMessages = async () => {
    const oldest = this.state.getLatestValue().messages[0]?.id;
    if (!oldest) return;
    const page = await this.channel.query({ messages: { id_lt: oldest, limit: PAGE_SIZE } });
    this.state.partialNext({
      hasOlderMessages: page.messages.length >= PAGE_SIZE,
      messages: [...this.channel.state.messages],
    });
  };

  /** Stops following the channel. */
  close() {
    for (const stop of this.stops.splice(0)) stop();
  }
}

/** A reply the agent wrote. */
export const isAgentReply = (message: LocalMessage) => message.ai_generated === true;

/** A reply with nothing to show yet: no text, no steps and no UI. */
export const isEmptyReply = (message: LocalMessage) =>
  !message.text &&
  !message.ai_ui &&
  !(message.attachments ?? []).some(
    (attachment) => attachment.type === 'ai_reasoning' || attachment.type === 'ai_tool_call',
  );
