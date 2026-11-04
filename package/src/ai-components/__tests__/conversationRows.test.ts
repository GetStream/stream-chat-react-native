import { renderHook } from '@testing-library/react-native';

import type { AIMessage, AIPendingMessage } from '../conversation/types';
import {
  type ConversationRow,
  useConversationRows,
  type UseConversationRowsOptions,
} from '../conversation/useConversationRows';

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
