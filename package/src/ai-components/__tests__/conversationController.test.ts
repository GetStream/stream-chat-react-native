import {
  AIAgentActivityStates,
  AIAgentError,
  AIConversationController,
  type AIConversationControllerOptions,
  type AIConversationFeed,
  type AIConversationRequest,
  type AIConversationTransport,
  type AIMessage,
  type AIMessageRating,
  createNewComposerStore,
  isAIConversationAnswering,
} from '..';
import type { MediaAsset } from '../services/media-picker-service/AbstractMediaPickerService';

const user = (id: string, text = 'Plan a weekend in Lisbon'): AIMessage => ({
  id,
  role: 'user',
  text,
});

const reply = (id: string, text = 'Here’s a plan', generating = false): AIMessage => ({
  id,
  isGenerating: generating,
  role: 'assistant',
  text,
});

const photo: MediaAsset = { name: 'alfama.jpg', type: 'image/jpeg', uri: 'file:///tmp/alfama.jpg' };
const plan: MediaAsset = {
  name: 'itinerary.pdf',
  type: 'application/pdf',
  uri: 'file:///tmp/itinerary.pdf',
};

class TransportError extends Error {}

const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

type Held = { reject: (error: unknown) => void; resolve: () => void };

const hold = (list: Held[]) =>
  new Promise<void>((resolve, reject) => {
    list.push({ reject, resolve });
  });

// Holds each send, stop, load and rating until the test finishes it.
class ConversationTransport implements AIConversationTransport {
  feed: AIConversationFeed | undefined;
  requests: AIConversationRequest[] = [];
  stops = 0;
  loads = 0;
  ratings: { id: string; rating: AIMessageRating | null }[] = [];
  sendError: unknown;
  stopError: unknown;
  loadError: unknown;
  failsRating: (rating: AIMessageRating | null) => boolean = () => false;
  holdsSends = false;
  holdsStops = false;
  holdsLoads = false;
  holdsRatings = false;
  disconnects = 0;
  private heldSends: Held[] = [];
  private heldStops: Held[] = [];
  private heldLoads: Held[] = [];
  private heldRatings: Held[] = [];

  constructor(private initialMessages: AIMessage[] = []) {}

  get lastRequest() {
    return this.requests[this.requests.length - 1];
  }

  connect = (feed: AIConversationFeed) => {
    this.feed = feed;
    feed.updateMessages(this.initialMessages);
    return () => {
      this.disconnects += 1;
    };
  };

  send = async (request: AIConversationRequest) => {
    this.requests.push(request);
    if (this.holdsSends) await hold(this.heldSends);
    if (this.sendError) throw this.sendError;
  };

  stop = async () => {
    this.stops += 1;
    if (this.holdsStops) await hold(this.heldStops);
    if (this.stopError) throw this.stopError;
  };

  loadOlderMessages = async () => {
    this.loads += 1;
    if (this.holdsLoads) await hold(this.heldLoads);
    if (this.loadError) throw this.loadError;
  };

  rate = async (message: AIMessage, rating: AIMessageRating | null) => {
    this.ratings.push({ id: message.id, rating });
    if (this.holdsRatings) await hold(this.heldRatings);
    if (this.failsRating(rating)) throw new TransportError();
  };

  finishSend(index: number, error?: unknown) {
    if (error) this.heldSends[index].reject(error);
    else this.heldSends[index].resolve();
  }

  finishStop(index: number) {
    this.heldStops[index].resolve();
  }

  finishRating(index: number, error?: unknown) {
    if (error) this.heldRatings[index].reject(error);
    else this.heldRatings[index].resolve();
  }

  finishLoads() {
    this.heldLoads.forEach(({ resolve }) => resolve());
    this.heldLoads = [];
  }

  update(messages: AIMessage[]) {
    this.feed?.updateMessages(messages);
  }

  updateActivity(activity: Parameters<AIConversationFeed['updateActivity']>[0]) {
    this.feed?.updateActivity(activity);
  }
}

const controllers: AIConversationController[] = [];

const makeController = (
  transport: AIConversationTransport,
  options: Omit<AIConversationControllerOptions, 'transport'> = {},
) => {
  const controller = new AIConversationController({ transport, ...options });
  controllers.push(controller);
  return controller;
};

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
});

const settle = async () => {
  for (let index = 0; index < 20; index++) await Promise.resolve();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitUntil = async (condition: () => boolean, timeout = 2000) => {
  const deadline = Date.now() + timeout;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('The condition wasn’t met in time');
    await sleep(10);
  }
};

const ids = (messages: readonly AIMessage[]) => messages.map(({ id }) => id);

const stateOf = (controller: AIConversationController) => controller.state.getLatestValue();

describe('AIConversationController following the conversation', () => {
  it('connects to the transport and shows its messages', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    expect(transport.feed).toBeDefined();
    const state = stateOf(controller);
    expect(ids(state.messages)).toEqual(['u1', 'a1']);
    expect(state.status).toBe('ready');
    expect(state.pendingMessage).toBeUndefined();
    expect(state.error).toBeUndefined();
    expect(state.hasOlderMessages).toBe(false);
  });

  it('keeps the composer and approver it is given', () => {
    const composer = createNewComposerStore();
    const approver = { clientId: 'ios-1', decide: async () => {}, userId: 'u_1' };
    const controller = makeController(new ConversationTransport(), { approver, composer });

    expect(controller.composer).toBe(composer);
    expect(controller.approver?.userId).toBe('u_1');
  });

  it('updates the messages and whether older ones can load', () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    transport.update([user('u1'), reply('a1')]);
    transport.feed?.updateHasOlderMessages(true);

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).hasOlderMessages).toBe(true);

    transport.feed?.updateHasOlderMessages(false);

    expect(stateOf(controller).hasOlderMessages).toBe(false);
  });

  it('lets go of the transport once disposed, and its updates go nowhere', () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    expect(transport.feed?.isConnected).toBe(true);
    controller.dispose();

    expect(transport.disconnects).toBe(1);
    expect(transport.feed?.isConnected).toBe(false);
    transport.update([user('u1')]);
    transport.updateActivity({ state: AIAgentActivityStates.thinking });
    transport.feed?.updateHasOlderMessages(true);
    expect(stateOf(controller).messages).toEqual([]);
    expect(stateOf(controller).status).toBe('ready');

    controller.dispose();
    expect(transport.disconnects).toBe(1);
  });

  it('keeps its state when nothing it shows changed', () => {
    const messages = [user('u1'), reply('a1')];
    const transport = new ConversationTransport(messages);
    const controller = makeController(transport);
    const before = stateOf(controller);

    transport.update([...messages]);

    expect(stateOf(controller)).toBe(before);
  });
});

describe('AIConversationController sending', () => {
  it('shows the message at once and asks the transport', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    const option = { id: 'think_harder', title: 'Think harder' };

    controller.send({
      attachments: [photo, plan],
      chatOption: option,
      text: 'And the restaurants?',
    });
    await settle();

    const state = stateOf(controller);
    expect(state.status).toBe('submitted');
    expect(state.pendingMessage?.text).toBe('And the restaurants?');
    expect(state.pendingMessage?.attachments?.map(({ kind }) => kind)).toEqual(['image', 'file']);
    expect(state.pendingMessage?.attachments?.map(({ url }) => url)).toEqual([photo.uri, plan.uri]);
    const request = transport.lastRequest;
    expect(transport.requests).toHaveLength(1);
    expect(request?.kind).toBe('message');
    expect(request?.text).toBe('And the restaurants?');
    expect(request?.attachments).toEqual([photo, plan]);
    expect(request?.chatOption).toEqual(option);
    expect(request?.message).toBeUndefined();
    // The transport can give the message the id its copy is found by.
    expect(request?.messageId).toBe(state.pendingMessage?.id);
    expect(ids(state.messages)).toEqual(['u1', 'a1']);
  });

  it('ignores a message with nothing in it', async () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    controller.send({ text: '  \n ' });
    await settle();

    expect(transport.requests).toEqual([]);
    expect(stateOf(controller).status).toBe('ready');
    expect(stateOf(controller).pendingMessage).toBeUndefined();
  });

  it('sends only attachments', async () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    controller.send({ attachments: [photo], text: '' });
    await settle();

    expect(transport.lastRequest?.attachments).toEqual([photo]);
    expect(stateOf(controller).status).toBe('submitted');
  });

  it('waits until the reply starts', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.send({ text: 'And the restaurants?' });
    transport.update([user('u1'), reply('a1'), user('u2', 'And the restaurants?')]);

    // Kept until its reply starts, so the conversation can match its copy.
    expect(stateOf(controller).pendingMessage).toBeDefined();
    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a1'), user('u2'), reply('a2', '', true)]);

    // A reply that shows nothing hasn't started.
    expect(stateOf(controller).pendingMessage).toBeDefined();
    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a1'), user('u2'), reply('a2', 'Try', true)]);

    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');

    transport.update([user('u1'), reply('a1'), user('u2'), reply('a2', 'Try Taberna da Rua')]);

    expect(stateOf(controller).status).toBe('ready');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2', 'a2']);
  });

  it('ends when the reply arrives finished', () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    transport.update([user('u1', 'Hi'), reply('a1', 'Hello!')]);

    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
  });

  it('ends when a reply finishes with nothing in it', () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    transport.update([user('u1', 'Hi'), reply('a1', '')]);

    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
  });

  it('waits for its own reply while another is written', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    const controller = makeController(transport);
    expect(stateOf(controller).status).toBe('streaming');

    controller.send({ text: 'Make it three days' });
    transport.update([user('u1'), reply('a1', 'Day one, day two', true)]);

    expect(stateOf(controller).pendingMessage).toBeDefined();
    expect(stateOf(controller).status).toBe('submitted');

    transport.update([
      user('u1'),
      reply('a1', 'Day one, day two'),
      user('u2'),
      reply('a2', 'Three days', true),
    ]);

    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('shows the error when the transport fails, and retry sends it again', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.sendError = new TransportError();
    const controller = makeController(transport);

    controller.send({ attachments: [photo], text: 'And the restaurants?' });
    await settle();

    expect(stateOf(controller).status).toBe('error');
    expect(stateOf(controller).error).toBeInstanceOf(TransportError);
    // The message stays, to try again.
    expect(stateOf(controller).pendingMessage?.text).toBe('And the restaurants?');
    const failed = transport.lastRequest;

    transport.sendError = undefined;
    controller.retry();
    await settle();

    expect(transport.requests).toHaveLength(2);
    expect(transport.lastRequest?.kind).toBe('message');
    expect(transport.lastRequest?.text).toBe('And the restaurants?');
    expect(transport.lastRequest?.attachments).toEqual([photo]);
    // The transport can tell whether the message arrived the first time.
    expect(transport.lastRequest?.messageId).toBe(failed?.messageId);
    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
    expect(stateOf(controller).pendingMessage?.text).toBe('And the restaurants?');
  });

  it('shows no error when the send is aborted', async () => {
    const transport = new ConversationTransport();
    transport.sendError = abortError();
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    await settle();

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
    expect(stateOf(controller).pendingMessage).toBeUndefined();
  });

  it('wraps a rejection that isn’t an Error', async () => {
    const transport = new ConversationTransport();
    transport.sendError = 'offline';
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    await settle();

    expect(stateOf(controller).error?.message).toBe('offline');
  });

  it('ignores the failure of a request that was overtaken', async () => {
    const transport = new ConversationTransport();
    transport.holdsSends = true;
    const controller = makeController(transport);

    controller.send({ text: 'First' });
    controller.send({ text: 'Second' });
    await settle();
    transport.finishSend(0, new TransportError());
    await settle();

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
    expect(stateOf(controller).pendingMessage?.text).toBe('Second');

    transport.finishSend(1);
    await settle();

    // A request that reaches the agent waits for its reply.
    expect(stateOf(controller).status).toBe('submitted');
  });

  it('streams a reply that started before the transport returned', async () => {
    const transport = new ConversationTransport();
    transport.holdsSends = true;
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    await settle();
    transport.update([user('u1', 'Hi'), reply('a1', 'Hello', true)]);
    transport.finishSend(0);
    await settle();

    expect(stateOf(controller).status).toBe('streaming');
    expect(stateOf(controller).pendingMessage).toBeUndefined();
  });

  it('ignores the failure of a request whose reply arrived first', async () => {
    const transport = new ConversationTransport();
    transport.holdsSends = true;
    const controller = makeController(transport);

    controller.send({ text: 'Hi' });
    await settle();
    transport.update([user('u1', 'Hi'), reply('a1', 'Hello')]);
    transport.finishSend(0, new TransportError());
    await settle();

    // The agent had it.
    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
  });

  it('shows a failure while a reply is written once that reply is finished', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    transport.sendError = new TransportError();
    const controller = makeController(transport);

    controller.send({ text: 'Make it three days' });
    await settle();

    expect(stateOf(controller).error).toBeInstanceOf(TransportError);
    // The agent is still answering.
    expect(stateOf(controller).status).toBe('streaming');

    transport.update([user('u1'), reply('a1', 'Day one, day two')]);

    expect(stateOf(controller).status).toBe('error');
  });

  it('forgets the error when the failed request is answered after all', async () => {
    const transport = new ConversationTransport();
    transport.sendError = new TransportError();
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    await settle();

    transport.update([user('u1', 'Hi'), reply('a1', 'Hello', true)]);

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('shows the agent’s error when the reply doesn’t start in time', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport, { replyTimeout: 50 });

    controller.send({ text: 'Hi' });
    await waitUntil(() => stateOf(controller).status === 'error');

    const { error } = stateOf(controller);
    expect(error).toBeInstanceOf(AIAgentError);
    expect((error as AIAgentError).agentMessage).toBeUndefined();
    expect(stateOf(controller).pendingMessage?.text).toBe('Hi');

    transport.update([user('u1'), reply('a1'), user('u2', 'Hi'), reply('a2', 'Hello', true)]);

    // A late reply.
    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('waits for the reply while the agent says it is working', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport, { replyTimeout: 100 });
    controller.send({ text: 'Hi' });
    await settle();

    transport.updateActivity({ state: AIAgentActivityStates.thinking });
    await sleep(300);

    // However long it thinks.
    expect(stateOf(controller).status).toBe('submitted');
    expect(stateOf(controller).error).toBeUndefined();

    transport.updateActivity(undefined);
    await waitUntil(() => stateOf(controller).status === 'error');

    // It stopped saying it was working, without answering.
    expect(stateOf(controller).error).toBeInstanceOf(AIAgentError);
  });

  it('waits for the reply when the agent says it is working before the transport returns', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.holdsSends = true;
    const controller = makeController(transport, { replyTimeout: 100 });
    controller.send({ text: 'Hi' });
    await settle();

    transport.updateActivity({ state: AIAgentActivityStates.thinking });
    transport.finishSend(0);
    await settle();
    await sleep(300);

    expect(stateOf(controller).status).toBe('submitted');
  });

  it('waits as long as it takes without a timeout', async () => {
    for (const replyTimeout of [null, Infinity, 1e30]) {
      const controller = makeController(new ConversationTransport(), { replyTimeout });

      controller.send({ text: 'Hi' });
      await sleep(50);

      expect(stateOf(controller).status).toBe('submitted');
    }
  });

  it('forgets the previous error', async () => {
    const transport = new ConversationTransport();
    transport.sendError = new TransportError();
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    await settle();
    expect(stateOf(controller).error).toBeDefined();

    transport.sendError = undefined;
    controller.send({ text: 'Hi again' });

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
  });
});

describe('AIConversationController regenerating', () => {
  it('asks for a new reply in place of the old', async () => {
    const transport = new ConversationTransport([
      user('u1', 'Lisbon?'),
      reply('a1'),
      user('u2', 'Porto?'),
      reply('a2'),
    ]);
    const controller = makeController(transport);

    controller.regenerate(reply('a2'));
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    // A transport that can only send messages asks again.
    expect(transport.lastRequest?.text).toBe('Porto?');
    expect(transport.lastRequest?.message?.id).toBe('a2');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2']);
    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
  });

  it('sends the reply as the conversation has it', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'The latest text')]);
    const controller = makeController(transport);

    controller.regenerate(reply('a1', 'What a view once showed'));
    await settle();

    expect(transport.lastRequest?.message?.text).toBe('The latest text');
  });

  it('leaves out the replies after an earlier one', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1'), user('u2'), reply('a2')]);
    const controller = makeController(transport);

    controller.regenerate(reply('a1'));

    expect(ids(stateOf(controller).messages)).toEqual(['u1']);
  });

  it('shows the new reply once it starts', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.regenerate(reply('a1'));
    transport.update([user('u1')]);

    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a2', 'Another plan', true)]);

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a2']);
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('shows a reply rewritten in place once it starts', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.regenerate(reply('a1'));
    transport.update([user('u1'), reply('a1', '', true)]);

    expect(ids(stateOf(controller).messages)).toEqual(['u1']);
    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a1', 'Another', true)]);

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).messages[1]?.text).toBe('Another');
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('brings the reply back when the transport fails', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.sendError = new TransportError();
    const controller = makeController(transport);

    controller.regenerate(reply('a1'));
    await settle();

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).status).toBe('error');

    transport.sendError = undefined;
    controller.retry();
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    expect(transport.lastRequest?.message?.id).toBe('a1');
  });

  it('ignores the person’s messages and ones not in the conversation', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.regenerate(user('u1'));
    controller.regenerate(reply('gone'));
    await settle();

    expect(transport.requests).toEqual([]);
    expect(stateOf(controller).status).toBe('ready');
  });

  it('regenerates a reply with no message before it', async () => {
    const transport = new ConversationTransport([reply('a0', 'Hi! How can I help?')]);
    const controller = makeController(transport);

    controller.regenerate(reply('a0'));
    await settle();

    expect(transport.lastRequest?.text).toBe('');
    expect(transport.lastRequest?.message?.id).toBe('a0');
  });
});

describe('AIConversationController editing', () => {
  it('puts the message in the composer', () => {
    const controller = makeController(
      new ConversationTransport([user('u1', 'Plan Lisbon'), reply('a1')]),
    );

    controller.edit(user('u1', 'Plan Lisbon'));

    expect(controller.editingMessage?.id).toBe('u1');
    expect(controller.composer.getLatestValue().text).toBe('Plan Lisbon');
    // The composer shows the person is editing.
    expect(controller.composer.getLatestValue().isEditing).toBe(true);
  });

  it('sends a new message once editing is cancelled in the composer', async () => {
    const transport = new ConversationTransport([
      user('u1'),
      reply('a1'),
      user('u2', 'Plan Porto'),
      reply('a2'),
    ]);
    const controller = makeController(transport);
    controller.edit(user('u2', 'Plan Porto'));

    controller.composer.partialNext({ isEditing: false, text: '' });
    controller.send({ text: 'What’s the weather in Tokyo?' });
    await settle();

    expect(controller.editingMessage).toBeUndefined();
    expect(transport.lastRequest?.kind).toBe('message');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2', 'a2']);
  });

  it('brings the messages back when the transport fails', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.sendError = new TransportError();
    const controller = makeController(transport);
    controller.edit(user('u1'));

    controller.send({ text: 'Plan Porto' });
    await settle();

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('error');

    transport.sendError = undefined;
    controller.retry();
    await settle();

    expect(transport.lastRequest?.kind).toBe('edit');
    expect(transport.lastRequest?.text).toBe('Plan Porto');
  });

  it('ignores replies', () => {
    const controller = makeController(new ConversationTransport([user('u1'), reply('a1')]));

    controller.edit(reply('a1'));

    expect(controller.editingMessage).toBeUndefined();
    expect(controller.composer.getLatestValue().text).toBe('');
  });

  it('replaces the message and what follows', async () => {
    const original: AIMessage = {
      attachments: [{ kind: 'image', url: 'https://example.com/porto.jpg' }],
      id: 'u2',
      role: 'user',
      text: 'Plan Porto',
    };
    const transport = new ConversationTransport([user('u1'), reply('a1'), original, reply('a2')]);
    const controller = makeController(transport);

    controller.edit(original);
    controller.send({ attachments: [photo], text: 'Plan Porto for two' });
    await settle();

    expect(controller.editingMessage).toBeUndefined();
    expect(controller.composer.getLatestValue().isEditing).toBe(false);
    expect(transport.lastRequest?.kind).toBe('edit');
    expect(transport.lastRequest?.message?.id).toBe('u2');
    expect(transport.lastRequest?.text).toBe('Plan Porto for two');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).pendingMessage?.text).toBe('Plan Porto for two');
    // The edit keeps what the message carried.
    expect(stateOf(controller).pendingMessage?.attachments?.map(({ url }) => url)).toEqual([
      'https://example.com/porto.jpg',
      photo.uri,
    ]);
    expect(stateOf(controller).status).toBe('submitted');

    transport.update([
      user('u1'),
      reply('a1'),
      user('u2', 'Plan Porto for two'),
      reply('a3', 'For two', true),
    ]);

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2', 'a3']);
    expect(stateOf(controller).pendingMessage).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('empties the composer once cancelled', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.edit(user('u1'));

    controller.cancelEditing();
    controller.send({ text: 'Something else' });
    await settle();

    expect(controller.editingMessage).toBeUndefined();
    expect(controller.composer.getLatestValue().text).toBe('');
    expect(transport.lastRequest?.kind).toBe('message');
  });

  it('keeps the composer when cancelled while not editing', () => {
    const controller = makeController(new ConversationTransport());
    controller.composer.partialNext({ text: 'Half a thought' });

    controller.cancelEditing();

    expect(controller.composer.getLatestValue().text).toBe('Half a thought');
  });
});

describe('AIConversationController stopping', () => {
  it('ends the reply and tells the transport', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    const controller = makeController(transport);
    expect(stateOf(controller).status).toBe('streaming');

    controller.stop();
    await settle();

    expect(transport.stops).toBe(1);
    expect(stateOf(controller).status).toBe('ready');

    transport.update([user('u1'), reply('a1', 'Day one', true)]);

    // A stopped reply is finished, however long the conversation says otherwise.
    expect(stateOf(controller).status).toBe('ready');
    // What it wrote so far stays.
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
  });

  it('keeps the person’s message while waiting', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });

    controller.stop();
    await settle();

    // It is on its way until its copy arrives.
    expect(stateOf(controller).pendingMessage?.text).toBe('Hi');
    expect(stateOf(controller).status).toBe('ready');
    expect(transport.stops).toBe(1);
  });

  it('finishes a reply that arrives after a stop while waiting', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    controller.stop();
    await settle();

    transport.update([user('u1'), reply('a1'), user('u2', 'Hi'), reply('a2', '', true)]);

    expect(stateOf(controller).status).toBe('ready');
    // It has nothing to show.
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2']);

    transport.update([user('u1'), reply('a1'), user('u2', 'Hi'), reply('a2', 'Hello', true)]);

    // The person stopped it.
    expect(stateOf(controller).status).toBe('ready');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1', 'u2', 'a2']);
    expect(stateOf(controller).pendingMessage).toBeUndefined();
  });

  it('lets the next request’s reply stream after a stop while waiting', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    controller.stop();
    await settle();

    controller.send({ text: 'Porto?' });
    transport.update([
      user('u1'),
      reply('a1'),
      user('u2', 'Hi'),
      user('u3', 'Porto?'),
      reply('a3', 'Sure', true),
    ]);

    expect(stateOf(controller).status).toBe('streaming');
  });

  it('brings the reply back when stopped while waiting for it to be regenerated', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.regenerate(reply('a1'));
    expect(ids(stateOf(controller).messages)).toEqual(['u1']);

    controller.stop();

    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);
    expect(stateOf(controller).status).toBe('ready');
  });

  it('sends after a stop only once the stop reached the transport', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    transport.holdsStops = true;
    const controller = makeController(transport);

    controller.stop();
    controller.send({ text: 'Something else' });
    await settle();

    expect(transport.stops).toBe(1);
    // The stop would stop it too.
    expect(transport.requests).toEqual([]);
    expect(stateOf(controller).status).toBe('submitted');

    transport.finishStop(0);
    await settle();

    expect(transport.lastRequest?.text).toBe('Something else');
  });

  it('leaves out a reply that shows nothing', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', '', true)]);
    const controller = makeController(transport);
    expect(stateOf(controller).status).toBe('submitted');

    controller.stop();

    // The conversation would think it is still on its way.
    expect(ids(stateOf(controller).messages)).toEqual(['u1']);
    expect(stateOf(controller).status).toBe('ready');
  });

  it('does nothing when the agent isn’t answering', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.stop();
    await settle();

    expect(transport.stops).toBe(0);
  });

  it('ignores what the agent says until it stops saying', () => {
    const transport = new ConversationTransport([user('u1')]);
    const controller = makeController(transport);
    transport.updateActivity({ state: AIAgentActivityStates.thinking });
    expect(stateOf(controller).status).toBe('submitted');

    controller.stop();
    transport.updateActivity({ state: AIAgentActivityStates.generating });

    expect(stateOf(controller).activity).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');

    transport.updateActivity(undefined);
    transport.updateActivity({ state: AIAgentActivityStates.thinking });

    expect(stateOf(controller).activity).toEqual({ state: AIAgentActivityStates.thinking });
    expect(stateOf(controller).status).toBe('submitted');
  });

  it('shows the reply still being written when the transport can’t stop it', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    transport.stopError = new TransportError();
    const controller = makeController(transport);

    controller.stop();
    await settle();

    // Nothing to try again.
    expect(stateOf(controller).error).toBeUndefined();
    // The composer offers to stop it again.
    expect(stateOf(controller).status).toBe('streaming');

    transport.update([user('u1'), reply('a1', 'Day one, day two')]);

    expect(stateOf(controller).status).toBe('ready');
  });

  it('waits for the reply again when the transport can’t stop it while waiting', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.stopError = new TransportError();
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });

    controller.stop();
    await settle();

    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a1'), user('u2', 'Hi'), reply('a2', 'Hello', true)]);

    expect(stateOf(controller).status).toBe('streaming');
  });

  it('ignores a stop’s failure after a new request', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    transport.stopError = new TransportError();
    const controller = makeController(transport);

    controller.stop();
    controller.send({ text: 'Something else' });
    await settle();

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
  });
});

describe('AIConversationController and what the agent says it is doing', () => {
  it('shows the agent working while the person’s message waits', () => {
    const transport = new ConversationTransport([user('u1')]);
    const controller = makeController(transport);
    expect(stateOf(controller).status).toBe('ready');

    transport.updateActivity({
      state: AIAgentActivityStates.checkingExternalSources,
      text: 'Searching the web',
    });

    expect(stateOf(controller).activity?.text).toBe('Searching the web');
    expect(stateOf(controller).status).toBe('submitted');

    transport.updateActivity(undefined);

    expect(stateOf(controller).activity).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
  });

  it('shows the agent working in an empty conversation', () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);

    transport.updateActivity({ state: AIAgentActivityStates.thinking });

    expect(stateOf(controller).status).toBe('submitted');
  });

  it('doesn’t take an activity after a finished reply as the agent answering', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    transport.updateActivity({ state: AIAgentActivityStates.generating });

    expect(stateOf(controller).activity?.state).toBe(AIAgentActivityStates.generating);
    // An indicator that wasn't cleared yet.
    expect(stateOf(controller).status).toBe('ready');
  });

  it('ends the request with the agent’s error', async () => {
    const transport = new ConversationTransport([user('u1', 'Lisbon?'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Porto?' });
    transport.update([user('u1', 'Lisbon?'), reply('a1'), user('u2', 'Porto?')]);

    transport.updateActivity({ state: AIAgentActivityStates.error, text: 'Rate limited' });

    // Its copy takes its place.
    expect(stateOf(controller).pendingMessage?.text).toBe('Porto?');
    expect(stateOf(controller).status).toBe('error');
    const { error } = stateOf(controller);
    expect(error).toBeInstanceOf(AIAgentError);
    expect((error as AIAgentError).agentMessage).toBe('Rate limited');
    expect(error?.message).toBe('Rate limited');

    transport.updateActivity(undefined);

    // It stays until the next request.
    expect(stateOf(controller).status).toBe('error');

    controller.retry();
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    expect(transport.lastRequest?.text).toBe('Porto?');
    // The message has no reply to replace.
    expect(transport.lastRequest?.message).toBeUndefined();
    expect(stateOf(controller).status).toBe('submitted');
    expect(stateOf(controller).error).toBeUndefined();
  });

  it('finishes the reply being written on an error', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    const controller = makeController(transport);

    transport.updateActivity({ state: AIAgentActivityStates.error });

    expect(stateOf(controller).status).toBe('error');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);

    controller.retry();
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    expect(transport.lastRequest?.message?.id).toBe('a1');
  });

  it('ignores the failure of the request an error ended', async () => {
    const transport = new ConversationTransport();
    transport.holdsSends = true;
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    await settle();

    transport.updateActivity({ state: AIAgentActivityStates.error, text: 'Rate limited' });
    transport.finishSend(0, new TransportError());
    await settle();

    expect((stateOf(controller).error as AIAgentError).agentMessage).toBe('Rate limited');
  });

  it('sends the person’s message again on retry when the error came before it arrived', async () => {
    const transport = new ConversationTransport([user('u1', 'Lisbon?'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Porto?' });
    await settle();
    const sent = transport.lastRequest;

    transport.updateActivity({ state: AIAgentActivityStates.error, text: 'Couldn’t read it' });
    transport.updateActivity(undefined);

    expect(stateOf(controller).pendingMessage?.text).toBe('Porto?');
    expect(ids(stateOf(controller).messages)).toEqual(['u1', 'a1']);

    controller.retry();
    await settle();

    // Not a1 written again.
    expect(transport.lastRequest?.kind).toBe('message');
    expect(transport.lastRequest?.messageId).toBe(sent?.messageId);
    expect(transport.lastRequest?.text).toBe('Porto?');
  });

  it('asks for the reply on retry when the person’s message arrived after the error', async () => {
    const transport = new ConversationTransport([user('u1', 'Lisbon?'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Porto?' });
    await settle();

    transport.updateActivity({ state: AIAgentActivityStates.error });
    transport.update([user('u1', 'Lisbon?'), reply('a1'), user('u2', 'Porto?')]);
    controller.retry();
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    expect(transport.lastRequest?.text).toBe('Porto?');
    expect(transport.lastRequest?.message).toBeUndefined();
  });

  it('forgets the error once a new reply starts', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.send({ text: 'Porto?' });
    transport.update([user('u1'), reply('a1'), user('u2', 'Porto?')]);
    transport.updateActivity({ state: AIAgentActivityStates.error });
    transport.updateActivity(undefined);
    expect(stateOf(controller).status).toBe('error');

    transport.update([
      user('u1'),
      reply('a1'),
      user('u2', 'Porto?'),
      reply('a2', 'Porto it is', true),
    ]);

    // The agent answered after all.
    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');

    transport.update([user('u1'), reply('a1'), user('u2', 'Porto?'), reply('a2', 'Porto it is')]);

    expect(stateOf(controller).status).toBe('ready');
    expect(stateOf(controller).pendingMessage).toBeUndefined();
  });

  it('forgets an error while a reply is written once the agent writes on', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    const controller = makeController(transport);
    transport.updateActivity({ state: AIAgentActivityStates.error });
    transport.updateActivity(undefined);

    transport.update([user('u1'), reply('a1', 'Day one')]);

    // The same reply, finished.
    expect(stateOf(controller).status).toBe('error');

    transport.update([user('u1'), reply('a1'), user('u2'), reply('a2', 'Day two', true)]);

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('streaming');
  });

  it('forgets what the agent said it was doing on a new request', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    transport.updateActivity({ state: AIAgentActivityStates.checkingExternalSources });

    controller.send({ text: 'Hi' });

    expect(stateOf(controller).activity).toBeUndefined();
  });
});

describe('AIConversationController errors', () => {
  it('does nothing on retry without an error', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.retry();
    await settle();

    expect(transport.requests).toEqual([]);
  });

  it('has nothing to retry after a stop failed', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day one', true)]);
    transport.stopError = new TransportError();
    const controller = makeController(transport);
    controller.stop();
    await settle();

    controller.retry();
    await settle();

    expect(transport.requests).toEqual([]);
  });

  it('does nothing on retry after the agent failed in an empty conversation', async () => {
    const transport = new ConversationTransport();
    const controller = makeController(transport);
    transport.updateActivity({ state: AIAgentActivityStates.error });

    controller.retry();
    await settle();

    expect(transport.requests).toEqual([]);
  });

  it('forgets the error and the request that failed', async () => {
    const transport = new ConversationTransport();
    transport.sendError = new TransportError();
    const controller = makeController(transport);
    controller.send({ text: 'Hi' });
    await settle();

    controller.clearError();
    controller.retry();
    await settle();

    expect(stateOf(controller).error).toBeUndefined();
    expect(stateOf(controller).status).toBe('ready');
    expect(transport.requests).toHaveLength(1);
  });

  it('describes an agent error in the agent’s words, else its own', () => {
    expect(new AIAgentError('Rate limited').message).toBe('Rate limited');
    expect(new AIAgentError().message).toBe("The agent couldn't answer. Try again.");
    expect(new AIAgentError('').agentMessage).toBeUndefined();
  });
});

describe('AIConversationController older messages', () => {
  it('asks the transport only while there are any', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    await controller.loadOlderMessages();
    expect(transport.loads).toBe(0);

    transport.feed?.updateHasOlderMessages(true);
    await controller.loadOlderMessages();
    expect(transport.loads).toBe(1);
  });

  it('loads once at a time', async () => {
    const transport = new ConversationTransport();
    transport.holdsLoads = true;
    const controller = makeController(transport);
    transport.feed?.updateHasOlderMessages(true);

    const first = controller.loadOlderMessages();
    const second = controller.loadOlderMessages();
    await settle();
    transport.finishLoads();
    await Promise.all([first, second]);

    expect(transport.loads).toBe(1);

    transport.holdsLoads = false;
    await controller.loadOlderMessages();

    expect(transport.loads).toBe(2);
  });

  it('rejects when the transport fails, and can load again', async () => {
    const transport = new ConversationTransport();
    transport.loadError = new TransportError();
    const controller = makeController(transport);
    transport.feed?.updateHasOlderMessages(true);

    await expect(controller.loadOlderMessages()).rejects.toBe(transport.loadError);
    await expect(controller.loadOlderMessages()).rejects.toBe(transport.loadError);

    expect(transport.loads).toBe(2);
    // Not a request of the person's.
    expect(stateOf(controller).error).toBeUndefined();
  });

  it('loads nothing and keeps ratings on the device with a transport that has neither', async () => {
    let feed: AIConversationFeed | undefined;
    const controller = makeController({
      connect: (connected) => {
        feed = connected;
      },
      send: async () => {},
      stop: async () => {},
    });

    feed?.updateHasOlderMessages(true);
    await controller.loadOlderMessages();
    controller.rate(reply('a1'), 'negative');
    await settle();

    expect(stateOf(controller).ratings.a1).toBe('negative');
  });
});

describe('AIConversationController ratings', () => {
  it('keeps the rating and tells the transport', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.rate(reply('a1'), 'positive');
    expect(stateOf(controller).ratings.a1).toBe('positive');
    await settle();
    controller.rate(reply('a1'), null);
    await settle();

    expect(stateOf(controller).ratings.a1).toBeUndefined();
    expect(transport.ratings).toEqual([
      { id: 'a1', rating: 'positive' },
      { id: 'a1', rating: null },
    ]);
  });

  it('does nothing when rated the same again', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.rate(reply('a1'), 'positive');
    controller.rate(reply('a1'), 'positive');
    await settle();

    expect(transport.ratings).toHaveLength(1);
  });

  it('puts the rating back when the transport fails', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);
    controller.rate(reply('a1'), 'positive');
    await settle();

    transport.failsRating = () => true;
    controller.rate(reply('a1'), 'negative');
    await settle();

    expect(stateOf(controller).ratings.a1).toBe('positive');
  });

  it('keeps the new rating when the transport fails after it changed again', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.failsRating = (rating) => rating === 'positive';
    const controller = makeController(transport);

    controller.rate(reply('a1'), 'positive');
    controller.rate(reply('a1'), 'negative');
    await settle();

    expect(stateOf(controller).ratings.a1).toBe('negative');
    // The rating it replaced before it was sent isn't.
    expect(transport.ratings.map(({ rating }) => rating)).toEqual(['negative']);
  });

  it('sends each reply’s ratings in order', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.holdsRatings = true;
    const controller = makeController(transport);

    controller.rate(reply('a1'), 'positive');
    await settle();
    controller.rate(reply('a1'), 'negative');
    await settle();

    // The next one waits.
    expect(transport.ratings.map(({ rating }) => rating)).toEqual(['positive']);

    transport.finishRating(0);
    await settle();
    transport.finishRating(1);
    await settle();

    expect(transport.ratings.map(({ rating }) => rating)).toEqual(['positive', 'negative']);
    expect(stateOf(controller).ratings.a1).toBe('negative');
  });

  it('keeps the latest when an earlier rating fails', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    transport.holdsRatings = true;
    const controller = makeController(transport);

    controller.rate(reply('a1'), 'positive');
    await settle();
    controller.rate(reply('a1'), 'negative');
    transport.finishRating(0, new TransportError());
    await settle();

    expect(stateOf(controller).ratings.a1).toBe('negative');

    transport.finishRating(1, new TransportError());
    await settle();

    // What the transport has.
    expect(stateOf(controller).ratings.a1).toBeUndefined();
  });

  it('shows the replies’ own until the person rates them', async () => {
    const rated: AIMessage = { ...reply('a1'), rating: 'positive' };
    const transport = new ConversationTransport([user('u1'), rated, reply('a2')]);
    const controller = makeController(transport);

    expect(stateOf(controller).ratings).toEqual({ a1: 'positive' });

    controller.rate(rated, null);
    await settle();

    expect(stateOf(controller).ratings).toEqual({});
    expect(transport.ratings.map(({ rating }) => rating)).toEqual([null]);

    transport.update([user('u1'), rated, reply('a2')]);

    // The person's rating stays over the one the reply still has.
    expect(stateOf(controller).ratings).toEqual({});
  });
});

describe('AIConversationController offers', () => {
  it('offers regenerating the latest reply while the agent isn’t answering', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1'), user('u2'), reply('a2')]);
    const controller = makeController(transport);

    expect(controller.replyActions(reply('a1'), false).onRegenerate).toBeUndefined();
    const latest = controller.replyActions(reply('a2'), true);
    expect(latest.onRegenerate).toBeDefined();

    latest.onRegenerate?.();
    await settle();

    expect(transport.lastRequest?.kind).toBe('regenerate');
    expect(transport.lastRequest?.message?.id).toBe('a2');
    // The agent is answering.
    expect(controller.replyActions(reply('a2'), true).onRegenerate).toBeUndefined();
  });

  it('rates and shows the rating', async () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport);

    controller.replyActions(reply('a1'), true).onRate?.('negative');
    await settle();

    expect(controller.replyActions(reply('a1'), true).rating).toBe('negative');
    expect(transport.ratings[0]?.rating).toBe('negative');
  });

  it('offers editing the person’s latest message while the agent isn’t answering', () => {
    const transport = new ConversationTransport([
      user('u1', 'Lisbon'),
      reply('a1'),
      user('u2', 'Porto'),
      reply('a2'),
    ]);
    const controller = makeController(transport);

    expect(controller.editAction(user('u1'))).toBeUndefined();
    expect(controller.editAction(reply('a2'))).toBeUndefined();
    const edit = controller.editAction(user('u2', 'Porto'));
    expect(edit).toBeDefined();

    edit?.();

    expect(controller.editingMessage?.id).toBe('u2');
    expect(controller.composer.getLatestValue().text).toBe('Porto');

    transport.update([user('u1'), reply('a1'), user('u2'), reply('a2', 'Porto it is', true)]);

    // The agent is answering.
    expect(controller.editAction(user('u2'))).toBeUndefined();
  });

  it('leaves out what the app doesn’t offer', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1')]);
    const controller = makeController(transport, { actions: { edit: false, regenerate: false } });

    expect(controller.replyActions(reply('a1'), true).onRegenerate).toBeUndefined();
    expect(controller.replyActions(reply('a1'), true).onRate).toBeDefined();
    expect(controller.editAction(user('u1'))).toBeUndefined();

    const nothing = makeController(transport, {
      actions: { edit: false, rate: false, regenerate: false },
    });

    expect(nothing.replyActions(reply('a1'), true).onRate).toBeUndefined();
    expect(makeController(transport).actions).toEqual({ edit: true, rate: true, regenerate: true });
  });
});

describe('AIConversationController status', () => {
  it('follows the latest reply', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', '', true)]);
    const controller = makeController(transport);

    expect(stateOf(controller).status).toBe('submitted');

    transport.update([user('u1'), reply('a1', 'Day', true)]);
    expect(stateOf(controller).status).toBe('streaming');

    transport.update([user('u1'), reply('a1', 'Day one')]);
    expect(stateOf(controller).status).toBe('ready');
  });

  it('is answering while submitted or streaming', () => {
    expect(isAIConversationAnswering('submitted')).toBe(true);
    expect(isAIConversationAnswering('streaming')).toBe(true);
    expect(isAIConversationAnswering('ready')).toBe(false);
    expect(isAIConversationAnswering('error')).toBe(false);
  });

  it('notifies a status follower only when the status changes', () => {
    const transport = new ConversationTransport([user('u1'), reply('a1', 'Day', true)]);
    const controller = makeController(transport);
    const statuses: string[] = [];
    const unsubscribe = controller.state.subscribeWithSelector(
      ({ status }) => ({ status }),
      ({ status }) => statuses.push(status),
    );
    statuses.splice(0);

    transport.update([user('u1'), reply('a1', 'Day one', true)]);
    transport.update([user('u1'), reply('a1', 'Day one, day two', true)]);
    transport.update([user('u1'), reply('a1', 'Day one, day two')]);

    expect(statuses).toEqual(['ready']);
    unsubscribe();
  });
});
