import type { AIConversationRequest, AIMessage } from '..';
import { AIConversationExchange } from '../conversation-state/controller/AIConversationExchange';

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

const conversation = [user('u1'), reply('a1'), user('u2'), reply('a2')];

const request = (overrides: Partial<AIConversationRequest>): AIConversationRequest => ({
  attachments: [],
  kind: 'message',
  messageId: 'm1',
  text: 'Hi',
  ...overrides,
});

const exchangeOf = (overrides: Partial<AIConversationRequest>, messages = conversation) =>
  new AIConversationExchange(1, request(overrides), messages);

describe('AIConversationExchange', () => {
  it('has a message on its way that replaces nothing', () => {
    const photo = { type: 'image/jpeg', uri: 'file:///tmp/alfama.jpg' };
    const exchange = exchangeOf({ attachments: [photo] });

    expect(exchange.pending?.id).toBe('m1');
    expect(exchange.pending?.text).toBe('Hi');
    expect(exchange.pending?.attachments?.map(({ url }) => url)).toEqual([photo.uri]);
    expect(exchange.replaced.size).toBe(0);
    expect([...exchange.known]).toEqual(['u1', 'a1', 'u2', 'a2']);
  });

  it('has a request of a kind of its own on its way like a message', () => {
    const exchange = exchangeOf({ kind: 'ui_action', message: reply('a2'), text: 'Picked Alfama' });

    expect(exchange.pending?.text).toBe('Picked Alfama');
    expect(exchange.replaced.size).toBe(0);
  });

  it('replaces the reply it regenerates and those after it', () => {
    const exchange = exchangeOf({ kind: 'regenerate', message: reply('a1'), text: '' });

    expect(exchange.pending).toBeUndefined();
    expect([...exchange.replaced.keys()]).toEqual(['a1', 'u2', 'a2']);
  });

  it('replaces nothing when it regenerates a reply not in the conversation', () => {
    const exchange = exchangeOf({ kind: 'regenerate', message: reply('gone'), text: '' });

    expect(exchange.replaced.size).toBe(0);
  });

  it('replaces the message it edits and those after it', () => {
    const exchange = exchangeOf({ kind: 'edit', message: user('u2'), text: 'Porto for two' });

    expect([...exchange.replaced.keys()]).toEqual(['u2', 'a2']);
    expect(exchange.pending?.text).toBe('Porto for two');
  });

  it('starts its reply when a new reply shows something', () => {
    const exchange = exchangeOf({});

    // The latest reply was there before.
    expect(exchange.hasReplyStarted(conversation)).toBe(false);
    expect(exchange.hasReplyStarted([...conversation, user('u3')])).toBe(false);
    expect(exchange.hasReplyStarted([...conversation, user('u3'), reply('a3', '', true)])).toBe(
      false,
    );
    expect(exchange.hasReplyStarted([...conversation, user('u3'), reply('a3', 'Sure', true)])).toBe(
      true,
    );
    expect(exchange.hasReplyStarted([...conversation, user('u3'), reply('a3', 'Sure')])).toBe(true);
    // Finished, with nothing to show.
    expect(exchange.hasReplyStarted([...conversation, user('u3'), reply('a3', '')])).toBe(true);
    expect(exchange.hasReplyStarted([])).toBe(false);
  });

  it('starts its reply when the one written again is rewritten', () => {
    const exchange = exchangeOf({ kind: 'regenerate', message: reply('a2'), text: '' });
    const rewriting = conversation.slice(0, -1);

    // Not rewritten yet.
    expect(exchange.hasReplyStarted(conversation)).toBe(false);
    expect(exchange.hasReplyStarted([...rewriting, reply('a2', '', true)])).toBe(false);
    // It is the reply, which shows nothing yet.
    expect(exchange.reply([...rewriting, reply('a2', '', true)])).toBeDefined();
    expect(exchange.hasReplyStarted([...rewriting, reply('a2', 'Another', true)])).toBe(true);
  });

  it('starts its reply when the one written again arrives finished', () => {
    const exchange = exchangeOf({ kind: 'regenerate', message: reply('a2'), text: '' });
    const rewriting = conversation.slice(0, -1);

    // An agent that doesn't stream.
    expect(exchange.hasReplyStarted([...rewriting, reply('a2', 'Another plan')])).toBe(true);
    // The reply as it was.
    expect(exchange.hasReplyStarted([...rewriting, reply('a2')])).toBe(false);
  });

  it('starts its reply when an edit’s reply is rewritten', () => {
    const exchange = exchangeOf({ kind: 'edit', message: user('u2'), text: 'Porto for two' });
    const edited = [user('u1'), reply('a1'), user('u2', 'Porto for two')];

    // Nothing changed yet.
    expect(exchange.hasReplyStarted(conversation)).toBe(false);
    // The person's message isn't the reply.
    expect(exchange.hasReplyStarted(edited)).toBe(false);
    // The reply as it was.
    expect(exchange.hasReplyStarted([...edited, reply('a2')])).toBe(false);
    expect(exchange.hasReplyStarted([...edited, reply('a2', 'For two', true)])).toBe(true);
    expect(exchange.hasReplyStarted([...edited, reply('a2', 'For two')])).toBe(true);
  });

  it('doesn’t take an answer that failed midway as rewritten until it changes', () => {
    const writing = [user('u1'), reply('a1', 'Day one', true)];
    const exchange = exchangeOf({ kind: 'regenerate', message: writing[1], text: '' }, writing);

    expect(exchange.reply(writing)).toBeUndefined();
    expect(exchange.reply([user('u1'), reply('a1', 'Day one')])).toBeUndefined();
    expect(exchange.reply([user('u1'), reply('a1', 'Day one, day two', true)])).toBeDefined();
  });

  it('finds the person’s message by its id, or as their first new message', () => {
    const exchange = exchangeOf({});

    expect(exchange.hasMessageArrived(conversation)).toBe(false);
    expect(exchange.hasMessageArrived([...conversation, user('m1')])).toBe(true);
    expect(exchange.hasMessageArrived([...conversation, user('u3')])).toBe(true);
    // Older messages loaded above.
    expect(exchange.hasMessageArrived([user('u0'), reply('a0'), ...conversation])).toBe(false);
    expect(exchange.hasMessageArrived([...conversation, reply('a3')])).toBe(false);
  });

  it('retries the request, unless the agent couldn’t answer a message it has', () => {
    const exchange = exchangeOf({});
    exchange.state = 'failed';

    // The same message, which the transport can tell.
    expect(exchange.retryRequest([...conversation, user('m1')]).messageId).toBe('m1');
    expect(exchange.retryRequest([...conversation, user('m1')]).kind).toBe('message');

    exchange.state = 'unanswered';

    // Its message never arrived.
    expect(exchange.retryRequest(conversation).kind).toBe('message');
    const again = exchange.retryRequest([...conversation, user('m1')]);
    expect(again.kind).toBe('regenerate');
    expect(again.text).toBe('Hi');
    // A reply to the latest message.
    expect(again.message).toBeUndefined();
    expect(again.messageId).not.toBe('m1');
  });

  it('shows the person’s message until its reply, and afterwards only for a new message', () => {
    const send = exchangeOf({});
    const edit = exchangeOf({ kind: 'edit', message: user('u2'), text: 'Porto for two' });

    expect(send.shownPending).toBeDefined();
    expect(edit.shownPending).toBeDefined();
    for (const state of ['stopped', 'failed', 'unanswered'] as const) {
      send.state = state;
      edit.state = state;
      expect(send.shownPending).toBeDefined();
      // The edited message comes back.
      expect(edit.shownPending).toBeUndefined();
      expect(send.hasFailed).toBe(state !== 'stopped');
    }
  });

  it('doesn’t take an old reply still being written as the new one', () => {
    const writing = [user('u1'), reply('a1', 'Day one', true)];
    const exchange = exchangeOf({ text: 'Make it three days' }, writing);

    expect(exchange.hasReplyStarted([user('u1'), reply('a1', 'Day one, day two', true)])).toBe(
      false,
    );
  });
});
