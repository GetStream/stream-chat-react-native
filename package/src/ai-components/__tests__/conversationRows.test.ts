import { renderHook } from '@testing-library/react-native';

import type { AIMessage, AIPendingMessage } from '../conversation/types';
import {
  type ConversationRow,
  useConversationRows,
  type UseConversationRowsOptions,
} from '../conversation/useConversationRows';
import type { AIMessagePartData } from '../message-parts/types';

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

const render = (options: UseConversationRowsOptions) =>
  renderHook((props: UseConversationRowsOptions) => useConversationRows(props), {
    initialProps: options,
  });

const shapeOf = (row: ConversationRow) =>
  row.kind === 'tail'
    ? `tail:${row.turnKey}${row.isThinking ? ':thinking' : ''}`
    : `${row.key}:${row.position}:${row.turnKey}`;

describe('useConversationRows', () => {
  it('lists the messages by turn and anchors the latest turn', () => {
    const { result } = render({
      messages: [user('q1', 'One?'), reply('a1', 'One.'), user('q2', 'Two?'), reply('a2', 'Two.')],
    });

    expect(result.current.rows.map(shapeOf)).toEqual([
      'q1:turn:q1',
      'a1:message:q1',
      'q2:turn:q2',
      'a2:message:q2',
    ]);
    expect(result.current.anchorKey).toBe('q2');
    expect(result.current.isEmpty).toBe(false);
  });

  it('is empty without messages, with nothing to anchor', () => {
    const { result } = render({ messages: [] });

    expect(result.current.rows).toEqual([]);
    expect(result.current.anchorKey).toBeUndefined();
    expect(result.current.isEmpty).toBe(true);
  });

  it('ends the latest turn with a row while the agent thinks or there is a footer', () => {
    const messages = [user('q1', 'One?')];
    const { rerender, result } = render({ messages });
    expect(result.current.rows.map(shapeOf)).toEqual(['q1:turn:q1']);

    rerender({ isThinking: true, messages });
    expect(result.current.rows.map(shapeOf)).toEqual(['q1:turn:q1', 'tail:q1:thinking']);

    rerender({ footer: 'Working', messages: [...messages, reply('a1', 'One.')] });
    expect(result.current.rows.map(shapeOf)).toEqual(['q1:turn:q1', 'a1:message:q1', 'tail:q1']);
  });

  describe('between the steps of a reply being written', () => {
    const reasoning = (id: string, status = 'completed'): AIMessagePartData => ({
      id,
      kind: 'ai_reasoning',
      payload: {},
      reasoning: { id, status },
      version: 1,
    });
    const call = (id: string, status: string): AIMessagePartData => ({
      id,
      kind: 'ai_tool_call',
      payload: {},
      toolCall: { executor: 'server', id, name: 'search', status },
      version: 1,
    });
    const writing = (parts: AIMessagePartData[], extra: Partial<AIMessage> = {}) => [
      user('q1', 'Weather?'),
      reply('a1', '', { isGenerating: true, parts, ...extra }),
    ];
    const tailOf = (rows: ConversationRow[]) => rows.find((row) => row.kind === 'tail');
    // When the reply's row says the agent started thinking again, if it is.
    const thinkingOf = (rows: ConversationRow[]) => {
      const row = rows.find((candidate) => candidate.key === 'a1');
      return row?.kind === 'entry' ? row.thinkingSince : undefined;
    };

    beforeEach(() => jest.useFakeTimers({ now: 1000 }));
    afterEach(() => jest.useRealTimers());

    it('thinks under the reply once every step so far is over, counting from then', () => {
      const { rerender, result } = render({
        messages: writing([reasoning('r1'), call('c1', 'running')]),
      });
      // The search shows itself while it runs.
      expect(thinkingOf(result.current.rows)).toBeUndefined();

      jest.setSystemTime(5000);
      rerender({ messages: writing([reasoning('r1'), call('c1', 'completed')]) });
      expect(thinkingOf(result.current.rows)).toBe(5000);
      // In the reply's row, which the thinking moves with as the steps fold, not a row of its own.
      expect(tailOf(result.current.rows)).toBeUndefined();

      // Still thinking, still counting from when it began.
      jest.setSystemTime(7000);
      rerender({ messages: writing([reasoning('r1'), call('c1', 'completed')]) });
      expect(thinkingOf(result.current.rows)).toBe(5000);

      // A step that ends starts the next run.
      jest.setSystemTime(9000);
      rerender({ messages: writing([reasoning('r1'), call('c1', 'completed'), reasoning('r2')]) });
      expect(thinkingOf(result.current.rows)).toBe(9000);
    });

    it('stops thinking once the answer starts, or the reply is done', () => {
      const parts = [reasoning('r1'), call('c1', 'completed')];
      const { rerender, result } = render({ messages: writing(parts) });
      expect(thinkingOf(result.current.rows)).toBe(1000);

      rerender({ messages: writing(parts, { text: 'It is sunny.' }) });
      expect(thinkingOf(result.current.rows)).toBeUndefined();

      // The answer pausing doesn't count as thinking again.
      rerender({ messages: writing(parts, { text: 'It is sunny.' }) });
      expect(thinkingOf(result.current.rows)).toBeUndefined();

      rerender({ messages: writing(parts, { isGenerating: false, text: 'It is sunny.' }) });
      expect(thinkingOf(result.current.rows)).toBeUndefined();
    });

    it('thinks after a step that follows what the agent wrote first, until it writes more', () => {
      const intro = { text: "I'll look it up." };
      const { rerender, result } = render({
        messages: writing([call('c1', 'running')], intro),
      });
      expect(thinkingOf(result.current.rows)).toBeUndefined();

      // With the break that follows what came before the step.
      rerender({ messages: writing([call('c1', 'completed')], { text: `${intro.text}\n\n` }) });
      expect(thinkingOf(result.current.rows)).toBe(1000);

      rerender({
        messages: writing([call('c1', 'completed')], { text: "I'll look it up. It is" }),
      });
      expect(thinkingOf(result.current.rows)).toBeUndefined();
    });

    it('does not think for a step that ends together with more of the answer', () => {
      const { rerender, result } = render({
        messages: writing([call('c1', 'running')], { text: 'Looking.' }),
      });
      rerender({
        messages: writing([call('c1', 'completed')], { text: 'Looking. Found it:' }),
      });
      expect(thinkingOf(result.current.rows)).toBeUndefined();
    });

    it('leaves a step that is still going to show itself', () => {
      for (const parts of [
        [reasoning('r1', 'streaming')],
        [reasoning('r1'), call('c1', 'awaiting_approval')],
        [],
      ]) {
        const { result } = render({ messages: writing(parts) });
        expect(thinkingOf(result.current.rows)).toBeUndefined();
      }
    });

    it('times thinking before the reply shows anything by the turn', () => {
      const { result } = render({ isThinking: true, messages: writing([reasoning('r1')]) });
      expect(tailOf(result.current.rows)).toMatchObject({ isThinking: true });
      expect(thinkingOf(result.current.rows)).toBeUndefined();
    });
  });

  it('anchors a message on its way, and keeps its row for its copy', () => {
    const pending: AIPendingMessage = { id: 'local-1', text: 'Three?' };
    const messages = [user('q1', 'One?'), reply('a1', 'One.')];
    const { rerender, result } = render({ messages, pendingMessage: pending });
    expect(result.current.anchorKey).toBe('local-1');
    const pendingRow = result.current.rows[2];
    expect(pendingRow && shapeOf(pendingRow)).toBe('local-1:turn:local-1');

    // The copy arrives under the server's id, and takes over the row and its key.
    rerender({ messages: [...messages, user('q3', 'Three?')], pendingMessage: pending });
    expect(result.current.anchorKey).toBe('local-1');
    expect(result.current.rows.map(shapeOf)).toEqual([
      'q1:turn:q1',
      'a1:message:q1',
      'local-1:turn:local-1',
      'tail:local-1:thinking',
    ]);
  });

  it('keeps the object of every row that did not change', () => {
    const q1 = user('q1', 'One?');
    const { rerender, result } = render({ messages: [q1, reply('a1', 'On')] });
    const [firstRow, firstReply] = result.current.rows;

    rerender({ messages: [q1, reply('a1', 'One.')] });
    expect(result.current.rows[0]).toBe(firstRow);
    expect(result.current.rows[1]).not.toBe(firstReply);
  });
});
