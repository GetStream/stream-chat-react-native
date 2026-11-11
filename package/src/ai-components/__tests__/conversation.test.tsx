import React, { type ReactElement, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIConversationUserMessageProps,
} from '../conversation';
import { AIPendingMessageTracker, turnsOf } from '../conversation/entries';
import {
  AIConversationController,
  type AIConversationControllerOptions,
  type AIConversationFeed,
  type AIConversationTransport,
  type AIMessage,
  type AIToolApprover,
  createFromStreamMessage,
  fromStreamMessage,
  parseMessageParts,
  StreamTheme,
} from '../index';
import { forgetCallStates } from '../message-parts/callStates';

// Each test's questions start unanswered, though tests reuse calls.
afterEach(forgetCallStates);

jest.mock('../services/clipboard-service', () => ({ setClipboardString: jest.fn() }));

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

const layoutOf = (height: number) => ({
  nativeEvent: { layout: { height, width: 400, x: 0, y: 0 } },
});

// Lets the list apply what it measured, which it does on a later tick, with fake timers too.
const settle = async (ms = 20) => {
  if ('clock' in setTimeout) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(ms);
    });
  } else {
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  }
};

// The list renders its rows once it knows its size, and lets them be touched once each one is
// measured, which a real layout does.
const layOut = async () => {
  const list = screen.queryByTestId('ai-conversation-list');
  if (!list) return;
  act(() => {
    fireEvent(list, 'layout', layoutOf(800));
  });
  // Measuring rows can bring more into the range it renders: until every row is measured.
  for (let pass = 0; pass < 10; pass++) {
    const measured = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && !!node.props.onLayout && node !== list,
    );
    act(() => {
      for (const node of measured) node.props.onLayout(layoutOf(60));
    });
    await settle();
    const waiting = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && node.props.pointerEvents === 'none',
    );
    if (waiting.length === 0) return;
  }
};

// A scroll event at the start of the list.
const atStart = {
  nativeEvent: {
    contentInset: { bottom: 0, left: 0, right: 0, top: 0 },
    contentOffset: { x: 0, y: 0 },
    contentSize: { height: 800, width: 400 },
    layoutMeasurement: { height: 800, width: 400 },
  },
};

// The person scrolling to the start of the list.
const scrollToStart = () => {
  act(() => {
    fireEvent.scroll(screen.getByTestId('ai-conversation-list'), atStart);
  });
};

const renderConversation = async (ui: ReactElement) => {
  const result = render(<StreamTheme>{ui}</StreamTheme>);
  await layOut();
  return {
    ...result,
    rerender: async (next: ReactElement) => {
      result.rerender(<StreamTheme>{next}</StreamTheme>);
      await layOut();
    },
  };
};

afterEach(() => {
  jest.useRealTimers();
});

describe('AIConversation', () => {
  it('shows the empty content while there are no messages', async () => {
    await renderConversation(
      <AIConversation emptyContent={<Text>Ask me anything</Text>} messages={[]} />,
    );
    expect(screen.getByText('Ask me anything')).toBeTruthy();
    // The list stays mounted under it, so it follows a keyboard opened before the first question.
    expect(screen.getByTestId('ai-conversation-list')).toBeTruthy();
  });

  it('hides the empty content once there are messages', async () => {
    const { rerender } = await renderConversation(
      <AIConversation emptyContent={<Text>Ask me anything</Text>} messages={[]} />,
    );
    await rerender(
      <AIConversation
        emptyContent={<Text>Ask me anything</Text>}
        messages={[user('u1', 'Is 7 prime?')]}
      />,
    );
    expect(screen.queryByText('Ask me anything')).toBeNull();
    expect(screen.getByText('Is 7 prime?')).toBeTruthy();
  });

  it('groups the messages into turns, each starting with a question', async () => {
    const messages = [
      reply('a0', 'Hi, I am your assistant.'),
      user('u1', 'What time is it?'),
      reply('a1', 'It is noon.'),
      user('u2', 'And the weather?'),
      reply('a2', 'Sunny.'),
    ];
    const turns = turnsOf(new AIPendingMessageTracker().entries(messages));
    expect(turns.map((turn) => turn.id)).toEqual(['a0', 'u1', 'u2']);
    expect(turns[2].entries.map((entry) => entry.id)).toEqual(['u2', 'a2']);
    expect(turns[2].entries[1].isLatestReply).toBe(true);

    await renderConversation(<AIConversation footer={<Text>footer</Text>} messages={messages} />);
    for (const { text } of messages) expect(screen.getByText(text)).toBeTruthy();
    expect(screen.getAllByText('footer')).toHaveLength(1);
  });

  it('keeps a turn that starts with a reply when older messages load above it', () => {
    const starts = new Set<string>();
    const tracker = new AIPendingMessageTracker();
    const page = [
      reply('a1', 'It is noon.'),
      user('u2', 'And the weather?'),
      reply('a2', 'Sunny.'),
    ];
    expect(turnsOf(tracker.entries(page), starts).map((turn) => turn.id)).toEqual(['a1', 'u2']);

    const older = [user('u1', 'What time is it?'), ...page];
    expect(turnsOf(tracker.entries(older), starts).map((turn) => turn.id)).toEqual([
      'u1',
      'a1',
      'u2',
    ]);
  });

  it('takes the copy of a message on its way that arrives in the update that first passes it', () => {
    const tracker = new AIPendingMessageTracker();
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    tracker.entries(history);
    const pending = { id: 'local-1', text: 'Plan my day' };
    const entries = tracker.entries([...history, user('stream-u2', 'Plan my day')], pending);
    expect(entries.map((entry) => entry.id)).toEqual(['u1', 'a1', 'local-1']);
    expect(entries.filter((entry) => entry.pending)).toHaveLength(0);
  });

  it('shows a pending message with the agent thinking, until its reply starts', async () => {
    const mounts: string[] = [];
    const UserMessage = ({ text }: AIConversationUserMessageProps) => {
      useEffect(() => {
        mounts.push(text);
      }, [text]);
      return <Text>{text}</Text>;
    };
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    const pending = { id: 'local-1', text: 'Plan my day' };
    const { rerender } = await renderConversation(
      <AIConversation messages={history} pendingMessage={pending} UserMessage={UserMessage} />,
    );
    expect(screen.getByText('Plan my day')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();

    // Stream's copy arrives with another id: it takes over the pending row, under its key.
    await rerender(
      <AIConversation
        messages={[...history, user('stream-u2', 'Plan my day')]}
        pendingMessage={pending}
        UserMessage={UserMessage}
      />,
    );
    expect(screen.getAllByText('Plan my day')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();

    // A reply being written that shows nothing yet: still thinking.
    await rerender(
      <AIConversation
        messages={[
          ...history,
          user('stream-u2', 'Plan my day'),
          reply('a2', '', { isGenerating: true }),
        ]}
        pendingMessage={pending}
        UserMessage={UserMessage}
      />,
    );
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();

    await rerender(
      <AIConversation
        messages={[
          ...history,
          user('stream-u2', 'Plan my day'),
          reply('a2', 'Here is your plan.', { isGenerating: true }),
        ]}
        UserMessage={UserMessage}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Thinking...' })).toBeNull();
    expect(screen.getByText('Here is your plan.')).toBeTruthy();
    // The row the pending message showed in was never mounted again.
    expect(mounts.filter((text) => text === 'Plan my day')).toHaveLength(1);
  });

  it('finds the copy of a pending message by its id', async () => {
    const pending = { id: 'm-2', text: 'Draft' };
    const { rerender } = await renderConversation(
      <AIConversation messages={[user('m-1', 'Draft')]} pendingMessage={pending} />,
    );
    // the earlier message saying the same is not its copy
    expect(screen.getAllByText('Draft')).toHaveLength(2);
    await rerender(
      <AIConversation
        messages={[user('m-1', 'Draft'), user('m-2', 'Draft')]}
        pendingMessage={pending}
      />,
    );
    expect(screen.getAllByText('Draft')).toHaveLength(2);
  });

  it('shows the agent thinking when told to', async () => {
    await renderConversation(<AIConversation isThinking messages={[user('u1', 'Hi')]} />);
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();
  });

  it('shows reply actions under finished replies only', async () => {
    const onRate = jest.fn();
    const replyActions = (message: AIMessage, { isLatestReply }: { isLatestReply: boolean }) => ({
      onRate: (rating: 'positive' | 'negative' | null) => onRate(message.id, rating, isLatestReply),
      rating: null,
    });
    const { rerender } = await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'One'),
          reply('a1', 'Done.'),
          user('u2', 'Two'),
          reply('a2', 'Writing', { isGenerating: true }),
        ]}
        replyActions={replyActions}
      />,
    );
    expect(screen.getAllByTestId('ai-reply-actions')).toHaveLength(1);
    fireEvent.press(screen.getByRole('button', { name: 'Good response' }));
    expect(onRate).toHaveBeenCalledWith('a1', 'positive', false);

    await rerender(
      <AIConversation messages={[user('u1', 'One'), reply('a1', 'Done.')]} ReplyActions={null} />,
    );
    expect(screen.queryByTestId('ai-reply-actions')).toBeNull();
  });

  it('shows the actions under a reply once its answer is typed out', async () => {
    const answer = 'word '.repeat(200).trim();
    const { rerender } = await renderConversation(
      <AIConversation
        messages={[user('u1', 'One'), reply('a1', 'word', { isGenerating: true })]}
      />,
    );
    await rerender(<AIConversation messages={[user('u1', 'One'), reply('a1', answer)]} />);
    // Finished, and still typing out what arrived last.
    expect(screen.queryByTestId('ai-reply-actions')).toBeNull();
    await settle(2000);
    expect(screen.getByTestId('ai-reply-actions')).toBeTruthy();
  });

  it('keeps the actions of rows it reuses for other replies', async () => {
    const history = Array.from({ length: 40 }, (_, turn) => [
      user(`u${turn}`, `Question ${turn}`),
      reply(`a${turn}`, `Answer ${turn}.`),
    ]).flat();
    const watched = (text: string, extra: Partial<AIMessage> = {}) => [
      ...history,
      user('uw', 'Watched'),
      reply('aw', text, extra),
    ];
    const { rerender } = await renderConversation(
      <AIConversation messages={watched('Writ', { isGenerating: true })} />,
    );
    // A reply watched as it was written, whose actions came in, then a turn after it.
    await rerender(<AIConversation messages={watched('Written.')} />);
    await settle(2000);
    await rerender(
      <AIConversation
        messages={[...watched('Written.'), user('ul', 'Latest'), reply('al', 'Latest.')]}
      />,
    );
    await settle(2000);
    const actions = screen.getAllByTestId('ai-reply-actions');
    expect(screen.getByText('Written.')).toBeTruthy();
    expect(screen.queryByText('Answer 0.')).toBeNull();

    // Scrolled to the start, the rows at the end show the oldest replies.
    act(() => {
      fireEvent.scroll(screen.getByTestId('ai-conversation-list'), {
        nativeEvent: { ...atStart.nativeEvent, contentSize: { height: 5000, width: 400 } },
      });
    });
    await layOut();
    expect(screen.getByText('Answer 0.')).toBeTruthy();
    expect(screen.queryByText('Written.')).toBeNull();
    const shown = screen.getAllByTestId('ai-reply-actions');
    expect(actions.filter((view) => !shown.includes(view))).toEqual([]);
  }, 30000);

  it('shows a new rating when the messages stay the same', async () => {
    const messages = [user('u1', 'One'), reply('a1', 'Done.')];
    const rated = (rating: 'positive' | null) => (
      <AIConversation messages={messages} replyActions={() => ({ onRate: jest.fn(), rating })} />
    );
    const { rerender } = await renderConversation(rated(null));
    expect(screen.getByRole('button', { name: 'Good response', selected: false })).toBeTruthy();
    await rerender(rated('positive'));
    expect(screen.getByRole('button', { name: 'Good response', selected: true })).toBeTruthy();
  });

  it('renders messages through the slots', async () => {
    const UserMessage = ({ text }: AIConversationUserMessageProps) => <Text>user:{text}</Text>;
    const AssistantMessage = ({ message, text }: AIConversationAssistantMessageProps) => (
      <Text>
        agent:{message.id}:{text}
      </Text>
    );
    await renderConversation(
      <AIConversation
        AssistantMessage={AssistantMessage}
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        ReplyActions={() => <Text>actions</Text>}
        UserMessage={UserMessage}
      />,
    );
    expect(screen.getByText('user:Hi')).toBeTruthy();
    expect(screen.getByText('agent:a1:Hello')).toBeTruthy();
    expect(screen.getByText('actions')).toBeTruthy();
  });

  it('keeps the latest reply at its tallest, and lets the person’s message shrink', async () => {
    const UserMessage = ({ text }: AIConversationUserMessageProps) => <Text>{text}</Text>;
    const AssistantMessage = ({ text }: AIConversationAssistantMessageProps) => <Text>{text}</Text>;
    await renderConversation(
      <AIConversation
        AssistantMessage={AssistantMessage}
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        ReplyActions={null}
        UserMessage={UserMessage}
      />,
    );
    // The row is the view around the message with the list's side and top gaps.
    const rowOf = (text: string) => {
      let node = screen.getByText(text).parent;
      while (node) {
        const style = typeof node.type === 'string' ? StyleSheet.flatten(node.props.style) : null;
        if (style?.paddingHorizontal !== undefined && style.paddingTop !== undefined) return node;
        node = node.parent;
      }
      return null;
    };
    const minHeightOf = (text: string) =>
      StyleSheet.flatten(rowOf(text)?.props.style)?.minHeight ?? 0;
    const layOutRow = (text: string, height: number) =>
      act(() => {
        rowOf(text)?.props.onLayout?.(layoutOf(height));
      });

    layOutRow('Hello', 120);
    layOutRow('Hello', 60);
    expect(minHeightOf('Hello')).toBe(120);

    layOutRow('Hi', 120);
    layOutRow('Hi', 60);
    expect(rowOf('Hi')?.props.onLayout).toBeUndefined();
    expect(minHeightOf('Hi')).toBe(0);
  });

  it('renders again only the messages that changed', async () => {
    const renders: string[] = [];
    const AssistantMessage = ({ message, text }: AIConversationAssistantMessageProps) => {
      renders.push(message.id);
      return <Text>{text}</Text>;
    };
    const first = reply('a1', 'Done.');
    const conversation = (latest: AIMessage) => (
      <AIConversation
        AssistantMessage={AssistantMessage}
        messages={[user('u1', 'One'), first, user('u2', 'Two'), latest]}
        ReplyActions={null}
      />
    );
    const { rerender } = await renderConversation(
      conversation(reply('a2', 'Wri', { isGenerating: true })),
    );
    renders.length = 0;
    await rerender(conversation(reply('a2', 'Writing', { isGenerating: true })));
    expect(screen.getByText('Writing')).toBeTruthy();
    expect(renders).toEqual(['a2']);
  });

  it('shows reasoning, tool calls and approvals of a reply', async () => {
    let fail = true;
    const decide = jest.fn(() =>
      fail ? Promise.reject(new Error('offline')) : new Promise<void>(() => undefined),
    );
    const approver: AIToolApprover = { clientId: 'device-1', decide, userId: 'alex' };
    const parts = parseMessageParts([
      { duration_ms: 3000, id: 'r1', preview: 'Thinking about the weather.', status: 'completed', type: 'ai_reasoning', v: 1 },
      {
        approval: { title: 'Share your location?' },
        display_title: 'Checking your location',
        executor: 'client',
        id: 'call_1',
        name: 'get_location',
        status: 'awaiting_approval',
        target_client_id: 'device-1',
        target_user_id: 'alex',
        type: 'ai_tool_call',
        v: 1,
      },
    ]); // prettier-ignore
    await renderConversation(
      <AIConversation
        approver={approver}
        messages={[user('u1', 'Weather?'), reply('a1', '', { isGenerating: true, parts })]}
      />,
    );
    expect(screen.getByRole('button', { name: /Thought for 3s/ })).toBeTruthy();
    expect(screen.getByText('Checking your location')).toBeTruthy();
    expect(screen.getByText('Waiting for approval')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Allow' }));
    expect(decide).toHaveBeenCalledWith(parts[1].toolCall, true);
    await act(() => Promise.resolve());
    expect(screen.getByText("Your answer couldn't be sent. Try again.")).toBeTruthy();

    fail = false;
    fireEvent.press(screen.getByRole('button', { name: "Don't Allow" }));
    expect(decide).toHaveBeenLastCalledWith(parts[1].toolCall, false);
    expect(screen.queryByText("Your answer couldn't be sent. Try again.")).toBeNull();
    expect(screen.getByRole('button', { name: "Don't Allow" })).toBeDisabled();
  });

  describe('loading older messages', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('loads once the spinner has been in view a moment', async () => {
      const loadOlderMessages = jest.fn(() => Promise.resolve());
      const { rerender } = await renderConversation(
        <AIConversation
          loadOlderMessages={loadOlderMessages}
          messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      expect(screen.getByRole('progressbar', { name: 'Loading older messages' })).toBeTruthy();
      loadOlderMessages.mockClear();
      scrollToStart();
      act(() => jest.advanceTimersByTime(299));
      expect(loadOlderMessages).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(1));
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);

      await rerender(
        <AIConversation
          messages={[user('u0', 'Earlier'), user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('asks again after a load that failed, while the spinner stays in view', async () => {
      const loadOlderMessages = jest
        .fn<Promise<void>, []>()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue(undefined);
      await renderConversation(
        <AIConversation
          loadOlderMessages={loadOlderMessages}
          messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      scrollToStart();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(300);
      });
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2999);
      });
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1);
      });
      expect(loadOlderMessages).toHaveBeenCalledTimes(2);
    });

    it('waits for the list to come to rest', async () => {
      const loadOlderMessages = jest.fn(() => Promise.resolve());
      await renderConversation(
        <AIConversation
          loadOlderMessages={loadOlderMessages}
          messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      const list = screen.getByTestId('ai-conversation-list');
      loadOlderMessages.mockClear();

      // A finger holds the list at its start.
      act(() => {
        fireEvent(list, 'scrollBeginDrag', atStart);
      });
      scrollToStart();
      act(() => jest.advanceTimersByTime(1000));
      expect(loadOlderMessages).not.toHaveBeenCalled();

      // It lets go, and the list glides on.
      act(() => {
        fireEvent(list, 'scrollEndDrag', atStart);
        fireEvent(list, 'momentumScrollBegin', atStart);
      });
      act(() => jest.advanceTimersByTime(1000));
      expect(loadOlderMessages).not.toHaveBeenCalled();

      act(() => {
        fireEvent(list, 'momentumScrollEnd', atStart);
      });
      act(() => jest.advanceTimersByTime(300));
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);
    });
  });
});

describe('fromStreamMessage', () => {
  it('adapts a reply with its steps and attachments', () => {
    const reasoningText = jest.fn(() => 'The whole thought');
    // A step's fields are the router's own, which Stream's `Attachment` type doesn't list.
    const step = { id: 'r1', status: 'streaming', type: 'ai_reasoning', v: 1 };
    const message = fromStreamMessage(
      {
        ai_generated: true,
        attachments: [
          step,
          { image_url: 'https://cdn.example.com/a.jpg', title: 'a.jpg', type: 'image' },
          {
            asset_url: 'https://cdn.example.com/plan.pdf',
            file_size: 2400,
            mime_type: 'application/pdf',
            title: 'plan.pdf',
            type: 'file',
          },
          { type: 'connector_authorization' },
        ],
        generating: true,
        id: 'm1',
        text: 'Working on it',
      },
      { reasoningText },
    );
    expect(message).toMatchObject({
      attachments: [
        { kind: 'image', name: 'a.jpg', url: 'https://cdn.example.com/a.jpg' },
        {
          kind: 'file',
          mimeType: 'application/pdf',
          name: 'plan.pdf',
          size: 2400,
          url: 'https://cdn.example.com/plan.pdf',
        },
      ],
      id: 'm1',
      isGenerating: true,
      role: 'assistant',
      text: 'Working on it',
    });
    expect(message.parts?.map((part) => part.id)).toEqual(['r1']);
    expect(message.reasoningText?.('r1')).toBe('The whole thought');
    expect(reasoningText).toHaveBeenCalledWith('m1', 'r1');
  });

  it('leaves out the link previews Stream made from the text', () => {
    const message = fromStreamMessage({
      ai_generated: true,
      attachments: [
        {
          image_url: 'https://cal.com/og/index.png',
          og_scrape_url: 'Cal.com',
          title: 'Cal.com | Scheduling Software for Online Bookings',
          title_link: 'https://cal.com',
          type: 'image',
        },
        { image_url: 'https://cdn.example.com/a.jpg', title: 'a.jpg', type: 'image' },
      ],
      id: 'm1',
      text: 'Book it on Cal.com',
    });
    expect(message.attachments).toEqual([
      { kind: 'image', mimeType: undefined, name: 'a.jpg', url: 'https://cdn.example.com/a.jpg' },
    ]);
  });

  it('adapts the person’s message', () => {
    expect(fromStreamMessage({ attachments: [], id: 'u1', text: 'Hi' })).toMatchObject({
      isGenerating: false,
      parts: [],
      role: 'user',
    });
  });

  it('gives back the same message for the same Stream message, through its cache', () => {
    const adapt = createFromStreamMessage({ isAssistant: (message) => message.id === 'a1' });
    const stream = { attachments: [], id: 'a1', text: 'Hi' };
    const adapted = adapt(stream);
    expect(adapted.role).toBe('assistant');
    expect(adapt(stream)).toBe(adapted);
    expect(adapt({ ...stream, text: 'Hi there' })).not.toBe(adapted);
  });
});

// A transport the test drives: what it sends, stops and rates, and the messages it reports.
const conversationOf = (
  messages: AIMessage[],
  options: Omit<AIConversationControllerOptions, 'transport'> = {},
) => {
  let feed: AIConversationFeed | undefined;
  const transport = {
    connect: (connected: AIConversationFeed) => {
      feed = connected;
      connected.updateMessages(messages);
    },
    loadOlderMessages: jest.fn(() => Promise.resolve()),
    rate: jest.fn(() => Promise.resolve()),
    send: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
  } satisfies AIConversationTransport;
  const controller = new AIConversationController({ transport, ...options });
  const update = async (next: AIMessage[]) => {
    act(() => feed?.updateMessages(next));
    await layOut();
  };
  const olderMessages = async (hasOlderMessages: boolean) => {
    act(() => feed?.updateHasOlderMessages(hasOlderMessages));
    await layOut();
  };
  return { controller, olderMessages, transport, update };
};

const thinking = () => screen.queryByRole('button', { name: 'Thinking...' });

describe('AIConversation with a controller', () => {
  it('shows the conversation as the controller has it', async () => {
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    const { controller, update } = conversationOf(history);
    await renderConversation(<AIConversation conversation={controller} />);
    expect(screen.getByText('Hi!')).toBeTruthy();
    expect(thinking()).toBeNull();

    act(() => controller.send({ text: 'Plan my day' }));
    await layOut();
    expect(screen.getByText('Plan my day')).toBeTruthy();
    expect(thinking()).toBeTruthy();

    await update([
      ...history,
      user('u2', 'Plan my day'),
      reply('a2', 'Here is your plan.', { isGenerating: true }),
    ]);
    expect(thinking()).toBeNull();
    expect(screen.getByText('Here is your plan.')).toBeTruthy();
    expect(screen.getAllByText('Plan my day')).toHaveLength(1);
    controller.dispose();
  });

  it('leaves the other messages alone while a reply is written', async () => {
    let renders = 0;
    const UserMessage = ({ text }: AIConversationUserMessageProps) => {
      renders++;
      return <Text>{text}</Text>;
    };
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!'), user('u2', 'Plan my day')];
    const { controller, update } = conversationOf(history);
    await renderConversation(
      <AIConversation conversation={controller} UserMessage={UserMessage} />,
    );
    await update([...history, reply('a2', 'Here', { isGenerating: true })]);
    const before = renders;
    for (const text of ['Here is', 'Here is your', 'Here is your plan.']) {
      await update([...history, reply('a2', text, { isGenerating: true })]);
    }
    expect(screen.getByText('Here is your plan.')).toBeTruthy();
    expect(renders).toBe(before);
    controller.dispose();
  });

  it('shows the agent thinking while a reply is written again', async () => {
    const { controller } = conversationOf([user('u1', 'Hello'), reply('a1', 'Hi!')]);
    await renderConversation(<AIConversation conversation={controller} />);

    act(() => controller.regenerate(reply('a1', 'Hi!')));
    await layOut();

    expect(screen.queryByText('Hi!')).toBeNull();
    expect(thinking()).toBeTruthy();
    controller.dispose();
  });

  it('stops showing the agent thinking once stopped, with the message still on its way', async () => {
    const { controller, transport } = conversationOf([user('u1', 'Hello'), reply('a1', 'Hi!')]);
    await renderConversation(<AIConversation conversation={controller} />);
    act(() => controller.send({ text: 'Plan my day' }));
    await layOut();
    expect(thinking()).toBeTruthy();

    act(() => controller.stop());
    await layOut();

    expect(screen.getByText('Plan my day')).toBeTruthy();
    expect(thinking()).toBeNull();
    expect(transport.stop).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('offers the controller’s actions under replies and on the person’s latest message', async () => {
    const { controller, transport } = conversationOf([
      user('u1', 'Lisbon'),
      reply('a1', 'Lisbon it is'),
      user('u2', 'Porto'),
      reply('a2', 'Porto it is'),
    ]);
    await renderConversation(<AIConversation conversation={controller} />);

    // Regenerating the latest reply only, and editing the person's latest message only.
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);

    fireEvent.press(screen.getAllByRole('button', { name: 'Good response' })[0]);
    await layOut();
    expect(transport.rate).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant' }),
      'positive',
    );
    expect(screen.getAllByRole('button', { name: 'Good response' })[0]).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    expect(controller.editingMessage?.id).toBe('u2');
    expect(controller.composer.getLatestValue().text).toBe('Porto');

    fireEvent.press(screen.getByRole('button', { name: 'Regenerate' }));
    await layOut();
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'regenerate', text: 'Porto' }),
    );
    // The agent is answering.
    expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    controller.dispose();
  });

  it('offers what the app allows', async () => {
    const { controller } = conversationOf([user('u1', 'Lisbon'), reply('a1', 'Done')], {
      actions: { edit: false, rate: false },
    });
    await renderConversation(<AIConversation conversation={controller} />);

    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Good response' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeTruthy();
    controller.dispose();
  });

  it('loads older messages through the controller while there are any', async () => {
    const { controller, olderMessages } = conversationOf([user('u1', 'Hi'), reply('a1', 'Hello')]);
    await renderConversation(<AIConversation conversation={controller} />);
    expect(screen.queryByRole('progressbar', { name: 'Loading older messages' })).toBeNull();

    await olderMessages(true);

    expect(screen.getByRole('progressbar', { name: 'Loading older messages' })).toBeTruthy();
    controller.dispose();
  });
});
