import React, { type ReactElement } from 'react';

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import { AIConversation, type AIConversationUserMessageProps } from '../conversation';
import {
  AIBranchSwitcher,
  AIConversationController,
  type AIConversationTransport,
  type AIMessage,
  AIReplyActions,
  AIUserMessage,
  StreamTheme,
} from '../index';

jest.mock('../services/clipboard-service', () => ({ setClipboardString: jest.fn() }));

const user = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'user',
  text,
  ...extra,
});
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

// A message with a version mark, as `fromStreamMessage` reads it: its branch, and its response.
const branched = (
  message: AIMessage,
  of: 'reply' | 'question',
  index: number,
  count: number,
): AIMessage => ({ ...message, branch: { count, index, of }, responseId: `r-${message.id}` });

const renderView = (ui: ReactElement) => render(ui, { wrapper: StreamTheme });

// The person's message that says `text`, and the reply actions with the switcher named `name`.
const userMessageSaying = (text: string) => {
  const found = screen
    .getAllByTestId('ai-user-message')
    .find((node) => within(node).queryByText(text));
  if (!found) throw new Error(`No message says ${text}`);
  return found;
};
const replyActionsWith = (name: string) => {
  const found = screen
    .getAllByTestId('ai-reply-actions')
    .find((node) => within(node).queryByLabelText(name));
  if (!found) throw new Error(`No reply actions have ${name}`);
  return found;
};

const previous = () => screen.getByRole('button', { name: 'Previous version' });
const next = () => screen.getByRole('button', { name: 'Next version' });
const switcher = (name: string) => screen.getByLabelText(name);
const previousIn = (group: ReturnType<typeof switcher>) =>
  within(group).getByRole('button', { name: 'Previous version' });
const nextIn = (group: ReturnType<typeof switcher>) =>
  within(group).getByRole('button', { name: 'Next version' });

const layoutOf = (height: number) => ({
  nativeEvent: { layout: { height, width: 400, x: 0, y: 0 } },
});

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 20)));

// The list renders its rows once it knows its size, and each one once it is measured.
const layOut = async () => {
  const list = screen.queryByTestId('ai-conversation-list');
  if (!list) return;
  act(() => {
    fireEvent(list, 'layout', layoutOf(800));
  });
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

const renderConversation = async (ui: ReactElement) => {
  const result = render(<StreamTheme>{ui}</StreamTheme>);
  await layOut();
  return result;
};

describe('AIBranchSwitcher', () => {
  it('shows which version shows, out of how many', () => {
    renderView(<AIBranchSwitcher count={3} index={2} onNext={jest.fn()} onPrevious={jest.fn()} />);
    expect(switcher('Version 2 of 3')).toHaveTextContent('2/3');
  });

  it('renders nothing while there is one version', () => {
    renderView(<AIBranchSwitcher count={1} index={1} onNext={jest.fn()} onPrevious={jest.fn()} />);
    expect(screen.queryByTestId('ai-branch-switcher')).toBeNull();
  });

  it('disables each arrow at its end, and calls the other', () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    renderView(<AIBranchSwitcher count={3} index={1} onNext={onNext} onPrevious={onPrevious} />);
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
    fireEvent.press(previous());
    fireEvent.press(next());
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledTimes(1);

    screen.rerender(
      <AIBranchSwitcher count={3} index={3} onNext={onNext} onPrevious={onPrevious} />,
    );
    expect(previous()).toBeEnabled();
    expect(next()).toBeDisabled();
    fireEvent.press(previous());
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('disables an arrow that has nothing to call', () => {
    renderView(<AIBranchSwitcher count={3} index={2} />);
    expect(previous()).toBeDisabled();
    expect(next()).toBeDisabled();
  });
});

describe('AIReplyActions branch', () => {
  it('leads the reply’s actions with the switcher when it has several versions', () => {
    renderView(
      <AIReplyActions
        branch={{ count: 2, index: 2, onNext: jest.fn(), onPrevious: jest.fn() }}
        text='Hi'
      />,
    );
    const toolbar = screen.getByTestId('ai-reply-actions');
    expect(within(toolbar).getByLabelText('Version 2 of 2')).toBeTruthy();
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
  });

  it('shows the switcher under a reply with nothing else to offer', () => {
    renderView(<AIReplyActions branch={{ count: 2, index: 1, onNext: jest.fn() }} text='' />);
    expect(switcher('Version 1 of 2')).toBeTruthy();
  });

  it('shows no switcher for a reply with one version, or without a branch', () => {
    renderView(<AIReplyActions branch={{ count: 1, index: 1 }} text='Hi' />);
    expect(screen.queryByTestId('ai-branch-switcher')).toBeNull();
    screen.rerender(<AIReplyActions text='Hi' />);
    expect(screen.queryByTestId('ai-branch-switcher')).toBeNull();
  });
});

describe('AIUserMessage branch', () => {
  it('shows the switcher when the question has several versions', () => {
    const onPrevious = jest.fn();
    renderView(<AIUserMessage branch={{ count: 3, index: 3, onPrevious }} text='Hi' />);
    expect(switcher('Version 3 of 3')).toBeTruthy();
    expect(next()).toBeDisabled();
    fireEvent.press(previous());
    expect(onPrevious).toHaveBeenCalledTimes(1);

    screen.rerender(<AIUserMessage branch={{ count: 1, index: 1 }} text='Hi' />);
    expect(screen.queryByTestId('ai-branch-switcher')).toBeNull();
  });
});

describe('AIConversation branches', () => {
  it('passes replyActions’ branch to the reply’s actions', async () => {
    const onPrevious = jest.fn();
    await renderConversation(
      <AIConversation
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        replyActions={() => ({ branch: { count: 2, index: 2, onPrevious } })}
      />,
    );
    fireEvent.press(
      within(screen.getByTestId('ai-reply-actions')).getByLabelText('Previous version'),
    );
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('keeps the switcher under a version with no answer, to switch back from', async () => {
    const onNext = jest.fn();
    await renderConversation(
      <AIConversation
        messages={[user('u1', 'Hi'), branched(reply('a1', ''), 'reply', 1, 2)]}
        replyActions={() => ({ branch: { count: 2, index: 1, onNext } })}
      />,
    );
    fireEvent.press(within(screen.getByTestId('ai-reply-actions')).getByLabelText('Next version'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows no actions under an empty reply with one version', async () => {
    await renderConversation(
      <AIConversation
        messages={[user('u1', 'Hi'), reply('a1', '')]}
        replyActions={() => ({ onRegenerate: jest.fn() })}
      />,
    );
    expect(screen.queryByTestId('ai-reply-actions')).toBeNull();
  });

  it('passes userMessageActions’ branch to the default user message', async () => {
    const userMessageActions = jest.fn((message: AIMessage) =>
      message.branch?.of === 'question'
        ? { branch: { count: message.branch.count, index: message.branch.index } }
        : undefined,
    );
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Hi'),
          reply('a1', 'Hello'),
          user('u2', 'Plan my day', { branch: { count: 2, index: 2, of: 'question' } }),
          reply('a2', 'Sure'),
        ]}
        userMessageActions={userMessageActions}
      />,
    );
    expect(userMessageActions).toHaveBeenCalledWith(expect.objectContaining({ id: 'u2' }));
    expect(switcher('Version 2 of 2')).toBeTruthy();
  });

  it('hands a custom UserMessage branch and onSaveEdit', async () => {
    const UserMessage = jest.fn((_: AIConversationUserMessageProps) => null);
    const onSaveEdit = jest.fn();
    const branch = { count: 2, index: 1 };
    await renderConversation(
      <AIConversation
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        UserMessage={UserMessage}
        userMessageActions={() => ({ branch, onSaveEdit })}
      />,
    );
    expect(UserMessage.mock.calls[0][0]).toMatchObject({ branch, onSaveEdit, text: 'Hi' });
  });
});

describe('AIConversation with a controller whose transport switches versions', () => {
  const history = [
    branched(user('u1', 'Lisbon'), 'question', 2, 2),
    branched(reply('a1', 'Lisbon it is'), 'reply', 1, 3),
    user('u2', 'Porto'),
    reply('a2', 'Porto it is'),
  ];

  const controllers: AIConversationController[] = [];
  afterEach(() => controllers.splice(0).forEach((controller) => controller.dispose()));

  const conversationOf = (extra: Pick<AIConversationTransport, 'switchBranch'> = {}) => {
    const transport = {
      connect: jest.fn((feed) => feed.updateMessages(history)),
      send: jest.fn(() => Promise.resolve()),
      stop: jest.fn(() => Promise.resolve()),
      ...extra,
    } satisfies AIConversationTransport;
    const controller = new AIConversationController({ transport });
    controllers.push(controller);
    return { controller, transport };
  };

  it('shows the switcher on replies and questions with several versions, and switches', async () => {
    const switchBranch = jest.fn(() => Promise.resolve());
    const { controller } = conversationOf({ switchBranch });
    await renderConversation(<AIConversation conversation={controller} />);

    expect(screen.getAllByTestId('ai-branch-switcher')).toHaveLength(2);
    const question = switcher('Version 2 of 2');
    const answer = switcher('Version 1 of 3');
    // The reply's under it, with its actions; the question's on the person's message.
    expect(within(replyActionsWith('Version 1 of 3')).getByLabelText('Version 1 of 3')).toBe(
      answer,
    );
    expect(within(userMessageSaying('Lisbon')).getByLabelText('Version 2 of 2')).toBe(question);
    expect(nextIn(question)).toBeDisabled();
    expect(previousIn(answer)).toBeDisabled();

    fireEvent.press(previousIn(question));
    await settle();
    fireEvent.press(nextIn(answer));
    await settle();

    expect(switchBranch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'u1' }),
      'previous',
      expect.any(AbortSignal),
    );
    expect(switchBranch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'a1' }),
      'next',
      expect.any(AbortSignal),
    );
  });

  it('waits on the switched reply while a switch is on its way, and a message gives up on it', async () => {
    const switchBranch = jest.fn<
      Promise<void>,
      Parameters<NonNullable<AIConversationTransport['switchBranch']>>
    >(() => new Promise<void>(() => undefined));
    const { controller, transport } = conversationOf({ switchBranch });
    await renderConversation(<AIConversation conversation={controller} />);

    fireEvent.press(nextIn(switcher('Version 1 of 3')));
    await settle();

    // The switched reply's regenerate and the arrows wait; the rest stays.
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);
    expect(previousIn(switcher('Version 2 of 2'))).toBeDisabled();

    act(() => controller.send({ text: 'And Porto?' }));
    await settle();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'message', text: 'And Porto?' }),
    );
    expect(switchBranch.mock.calls[0][2]?.aborted).toBe(true);
    expect(controller.state.getLatestValue().isSwitchingBranch).toBe(false);
  });

  it('offers regenerating and editing every message, and disables the switcher while answering', async () => {
    const { controller, transport } = conversationOf({ switchBranch: () => Promise.resolve() });
    await renderConversation(<AIConversation conversation={controller} />);

    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);

    fireEvent.press(
      within(replyActionsWith('Version 1 of 3')).getByRole('button', { name: 'Regenerate' }),
    );
    await settle();
    await layOut();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'regenerate',
        message: expect.objectContaining({ id: 'a1' }),
        text: 'Lisbon',
      }),
    );
    // Everything after the reply written again is left out until the new reply starts, and
    // the agent is answering.
    expect(screen.queryByText('Porto')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(previousIn(switcher('Version 2 of 2'))).toBeDisabled();
  });

  it('edits an earlier message of the person’s in the composer', async () => {
    const { controller, transport } = conversationOf({ switchBranch: () => Promise.resolve() });
    await renderConversation(<AIConversation conversation={controller} />);

    fireEvent.press(within(userMessageSaying('Lisbon')).getByRole('button', { name: 'Edit' }));

    expect(controller.editingMessage?.id).toBe('u1');
    expect(controller.composer.getLatestValue().text).toBe('Lisbon');

    act(() => controller.send({ text: 'Lisbon in May' }));
    await settle();
    await layOut();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'edit',
        message: expect.objectContaining({ id: 'u1' }),
        text: 'Lisbon in May',
      }),
    );
    expect(screen.getByText('Lisbon in May')).toBeTruthy();
    expect(screen.queryByText('Porto')).toBeNull();
  });

  it('shows a failed switch as the conversation’s error', async () => {
    const switchBranch = jest.fn(() => Promise.reject(new Error('No such version')));
    const { controller } = conversationOf({ switchBranch });
    await renderConversation(<AIConversation conversation={controller} />);

    fireEvent.press(nextIn(switcher('Version 1 of 3')));
    await settle();

    expect(controller.state.getLatestValue().error?.message).toBe('No such version');
  });

  it('takes the app’s user-message actions over the controller’s', async () => {
    const { controller } = conversationOf({ switchBranch: () => Promise.resolve() });
    await renderConversation(
      <AIConversation conversation={controller} userMessageActions={() => undefined} />,
    );

    expect(screen.getAllByTestId('ai-branch-switcher')).toHaveLength(1);
    expect(switcher('Version 1 of 3')).toBeTruthy();
  });

  it('shows no switcher and offers the latest only without switchBranch', async () => {
    const { controller } = conversationOf();
    await renderConversation(<AIConversation conversation={controller} />);

    expect(screen.queryByTestId('ai-branch-switcher')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  });
});
