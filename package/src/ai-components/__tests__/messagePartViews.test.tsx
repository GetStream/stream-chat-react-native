import React, { type ReactElement } from 'react';
import { I18nManager, Text } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIMessagePart,
  type AIMessagePartData,
  AIMessageParts,
  AIReasoning,
  AIThinking,
  AIToolApproval,
  AIToolApprovalCard,
  type AIToolApprover,
  AIToolCall,
  type AIToolCallPart,
  parseMessagePart,
  StreamTheme,
} from '../index';
import { forgetCallStates } from '../message-parts/callStates';
import { AIThinkingClock, AIThinkingTurnContext } from '../reasoning/thinkingClock';

// Each test's questions start unanswered, though tests reuse calls.
afterEach(forgetCallStates);

const renderWithTheme = (ui: ReactElement) => {
  const result = render(<StreamTheme>{ui}</StreamTheme>);
  return {
    ...result,
    rerender: (next: ReactElement) => result.rerender(<StreamTheme>{next}</StreamTheme>),
  };
};

const toolCall = (overrides: Partial<AIToolCallPart> = {}): AIToolCallPart => ({
  executor: 'server',
  id: 'call_1',
  name: 'get_weather',
  status: 'running',
  ...overrides,
});

describe('AIToolCall', () => {
  it('names the call from its display title, else its name', () => {
    const { rerender } = renderWithTheme(
      <AIToolCall part={toolCall({ displayTitle: 'Checking the weather' })} />,
    );
    expect(screen.getByText('Checking the weather')).toBeTruthy();
    rerender(<AIToolCall part={toolCall()} />);
    expect(screen.getByText('get weather')).toBeTruthy();
  });

  it.each([
    ['awaiting_approval', 'Waiting for approval'],
    ['awaiting_authorization', 'Waiting for you to sign in'],
    ['awaiting_client', 'Waiting for the device'],
    ['failed', "Didn't complete"],
    ['cancelled', 'Cancelled'],
  ])('says what a %s call waits for', (status, detail) => {
    renderWithTheme(<AIToolCall part={toolCall({ status })} />);
    expect(screen.getByText(detail)).toBeTruthy();
  });

  it('prefers the summary, and says a declined call was declined', () => {
    const { rerender } = renderWithTheme(
      <AIToolCall part={toolCall({ status: 'failed', summary: 'No network' })} />,
    );
    expect(screen.getByText('No network')).toBeTruthy();
    rerender(
      <AIToolCall
        part={toolCall({
          approval: { decision: 'declined', title: 'Share?' },
          status: 'cancelled',
        })}
      />,
    );
    expect(screen.getByText('Declined')).toBeTruthy();
  });

  it('shows how long a finished call took', () => {
    const { rerender } = renderWithTheme(
      <AIToolCall part={toolCall({ durationMs: 420, status: 'completed' })} />,
    );
    expect(screen.getByText('0.4s')).toBeTruthy();
    rerender(<AIToolCall part={toolCall({ durationMs: 65_000, status: 'completed' })} />);
    expect(screen.getByText('1m 5s')).toBeTruthy();
    rerender(<AIToolCall part={toolCall({ durationMs: 65_000, status: 'running' })} />);
    expect(screen.queryByText('1m 5s')).toBeNull();
  });
});

describe('AIToolApprovalCard', () => {
  it('asks with the reason as a sentence and the agent’s own button titles', () => {
    const onDecide = jest.fn();
    renderWithTheme(
      <AIToolApprovalCard
        approval={{
          allowTitle: 'Share',
          message: 'Only your city is shared.',
          reason: 'to check the local weather',
          title: 'Share your location?',
        }}
        onDecide={onDecide}
      />,
    );
    expect(screen.getByText('To check the local weather.')).toBeTruthy();
    expect(screen.getByText('Only your city is shared.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Share' }));
    fireEvent.press(screen.getByRole('button', { name: "Don't Allow" }));
    expect(onDecide.mock.calls).toEqual([[true], [false]]);
  });
});

describe('AIToolApproval', () => {
  const asking = toolCall({
    approval: { title: 'Share your location?' },
    executor: 'client',
    status: 'awaiting_approval',
    targetClientId: 'ios-1',
    targetUserId: 'alex',
  });
  const approver = (decide: AIToolApprover['decide']): AIToolApprover => ({
    clientId: 'ios-1',
    decide,
    userId: 'alex',
  });

  it('shows what the call sends, folding long arguments', () => {
    const decide = jest.fn(() => Promise.resolve());
    const { rerender } = renderWithTheme(
      <AIToolApproval
        approver={approver(decide)}
        part={{ ...asking, arguments: { precision: 'city' } }}
      />,
    );
    expect(screen.getByText('What it sends')).toBeTruthy();
    expect(screen.getByText(/"precision": "city"/)).toBeTruthy();

    const long = { body: 'x'.repeat(300) };
    rerender(<AIToolApproval approver={approver(decide)} part={{ ...asking, arguments: long }} />);
    expect(screen.queryByText(/"body"/)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'What it sends' }));
    expect(screen.getByText(/"body"/)).toBeTruthy();

    rerender(<AIToolApproval approver={approver(decide)} part={{ ...asking, arguments: {} }} />);
    expect(screen.queryByText('What it sends')).toBeNull();
  });

  it('shows the approver’s own preview, or none, and hands it to a card of the app’s', () => {
    const decide = jest.fn(() => Promise.resolve());
    const part = { ...asking, arguments: { precision: 'city' } };
    const { rerender } = renderWithTheme(
      <AIToolApproval
        approver={{ ...approver(decide), argumentsPreview: () => <Text>Your city only</Text> }}
        part={part}
      />,
    );
    expect(screen.getByText('Your city only')).toBeTruthy();
    expect(screen.queryByText('What it sends')).toBeNull();

    rerender(
      <AIToolApproval
        approver={{ ...approver(decide), argumentsPreview: () => null }}
        part={part}
      />,
    );
    expect(screen.queryByText('What it sends')).toBeNull();

    const children = jest.fn((_approval, _state, _decide, preview) => <>{preview}</>);
    rerender(
      <AIToolApproval approver={approver(decide)} part={part}>
        {children}
      </AIToolApproval>,
    );
    expect(screen.getByText('What it sends')).toBeTruthy();
    expect(children.mock.calls[0]).toHaveLength(4);
  });

  it('asks only the targeted person on the targeted install', () => {
    const decide = jest.fn(() => Promise.resolve());
    const { rerender } = renderWithTheme(<AIToolApproval part={asking} />);
    expect(screen.queryByText('Share your location?')).toBeNull();
    rerender(<AIToolApproval approver={{ ...approver(decide), userId: 'sam' }} part={asking} />);
    expect(screen.queryByText('Share your location?')).toBeNull();
    rerender(<AIToolApproval approver={approver(decide)} part={asking} />);
    expect(screen.getByText('Share your location?')).toBeTruthy();
  });

  it('keeps an answer on its way when a list remounts or reuses the row', () => {
    const decide = jest.fn(() => new Promise<void>(() => undefined));
    const other = { ...asking, id: 'call-2' };
    const { rerender, unmount } = renderWithTheme(
      <AIToolApproval approver={approver(decide)} part={asking} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Allow' }));
    // The row now shows another call: its question starts unanswered.
    rerender(<AIToolApproval approver={approver(decide)} part={other} />);
    expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
    unmount();
    // The first call's row comes back: its answer is still on its way, so it can't be sent twice.
    renderWithTheme(<AIToolApproval approver={approver(decide)} part={asking} />);
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: "Don't Allow" }));
    expect(decide).toHaveBeenCalledTimes(1);
  });

  it('sends the answer once, and lets the person answer again when it fails', async () => {
    let fail: () => void = () => undefined;
    const decide = jest.fn(
      () =>
        new Promise<void>((_, reject) => {
          fail = () => reject(new Error('offline'));
        }),
    );
    renderWithTheme(<AIToolApproval approver={approver(decide)} part={asking} />);

    fireEvent.press(screen.getByRole('button', { name: 'Allow' }));
    fireEvent.press(screen.getByRole('button', { name: 'Allow' }));
    expect(decide).toHaveBeenCalledTimes(1);
    expect(decide).toHaveBeenCalledWith(asking, true);
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();

    await act(async () => {
      fail();
      await Promise.resolve();
    });
    expect(screen.getByText("Your answer couldn't be sent. Try again.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
  });
});

describe('AIMessagePart', () => {
  it('shows a placeholder for a step it cannot show', () => {
    renderWithTheme(<AIMessagePart part={parseMessagePart({ id: 'x', type: 'ai_citation' })!} />);
    expect(screen.getByText("A step this app version can't show")).toBeTruthy();
  });
});

describe('AIReasoning', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('counts the seconds while thinking, and folds when done', () => {
    jest.useFakeTimers();
    const text = 'First thought.\n\n## Plan\nSecond thought.';
    const { rerender } = renderWithTheme(<AIReasoning isThinking text={text} />);
    expect(screen.getByRole('button', { expanded: true, name: /Thinking\.\.\./ })).toBeTruthy();
    expect(screen.getByText('Plan')).toBeTruthy();

    act(() => jest.advanceTimersByTime(7_000));
    expect(screen.getByText('Thinking... 7s')).toBeTruthy();

    rerender(
      <AIReasoning duration={12} isThinking={false} summary='Planned the day' text={text} />,
    );
    expect(screen.getByRole('button', { expanded: false, name: /Thought for 12s/ })).toBeTruthy();
    expect(screen.getByText('Planned the day')).toBeTruthy();
    expect(screen.queryByText('Plan')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: /Thought for 12s/ }));
    expect(screen.getByRole('button', { expanded: true, name: /Thought for 12s/ })).toBeTruthy();
    expect(screen.getByText('Plan')).toBeTruthy();
  });

  it('shows a step’s live text, else its preview', () => {
    const part = { durationMs: 2000, id: 'r1', preview: 'The opening', status: 'completed' };
    const { rerender } = renderWithTheme(
      <AIReasoning initiallyExpanded part={part} reasoningText={() => 'The whole thought'} />,
    );
    expect(screen.getByText('The whole thought')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Thought for 2s/ })).toBeTruthy();
    rerender(<AIReasoning initiallyExpanded part={part} />);
    expect(screen.getByText('The opening')).toBeTruthy();
  });

  it('starts afresh for another step, as when a list reuses the view', () => {
    const step = (id: string, preview: string) => ({
      durationMs: 3000,
      id,
      preview,
      status: 'completed',
    });
    const { rerender } = renderWithTheme(
      <AIReasoning part={step('r1', 'First')} stepKey='m1:r1' />,
    );
    fireEvent.press(screen.getByRole('button', { name: /Thought for 3s/ }));
    expect(screen.getByText('First')).toBeTruthy();

    // The same step id in another message is another step: folded until its reader opens it.
    rerender(<AIReasoning part={step('r1', 'Second')} stepKey='m2:r1' />);
    expect(screen.getByRole('button', { expanded: false, name: /Thought for 3s/ })).toBeTruthy();
    expect(screen.queryByText('Second')).toBeNull();

    // While the step stays the same, what its reader chose stays too.
    fireEvent.press(screen.getByRole('button', { name: /Thought for 3s/ }));
    rerender(<AIReasoning part={step('r1', 'Second, longer')} stepKey='m2:r1' />);
    expect(screen.getByText('Second, longer')).toBeTruthy();
  });

  it('keeps the chevron that turns for another step, folded', () => {
    const step = (id: string, preview: string) => ({
      durationMs: 3000,
      id,
      preview,
      status: 'completed',
    });
    const turning = () =>
      screen.UNSAFE_root.findAll(
        (node) =>
          typeof node.type !== 'string' &&
          JSON.stringify(node.props?.style ?? '').includes('rotate'),
      );
    const { rerender } = renderWithTheme(
      <AIReasoning part={step('r1', 'First')} stepKey='m1:r1' />,
    );
    expect(turning()).toHaveLength(0);
    fireEvent.press(screen.getByRole('button', { name: /Thought for 3s/ }));
    const [chevron] = turning();
    expect(chevron).toBeTruthy();

    rerender(<AIReasoning part={step('r1', 'Second')} stepKey='m2:r1' />);
    expect(screen.getByRole('button', { expanded: false, name: /Thought for 3s/ })).toBeTruthy();
    expect(screen.queryByText('Second')).toBeNull();
    expect(turning()[0]).toBe(chevron);

    // And it opens the other step as it did the first.
    fireEvent.press(screen.getByRole('button', { name: /Thought for 3s/ }));
    expect(screen.getByText('Second')).toBeTruthy();
    expect(turning()[0]).toBe(chevron);
  });

  it('says Thinking... for thinking that shows nothing yet', () => {
    renderWithTheme(<AIThinking />);
    expect(screen.getByRole('button', { expanded: false, name: 'Thinking...' })).toBeTruthy();
  });

  it('counts afresh for thinking that began later, in the same view', () => {
    const { rerender } = renderWithTheme(<AIThinking since={Date.now() - 5000} />);
    const view = screen.getByTestId('ai-reasoning');
    expect(screen.getByRole('button', { name: 'Thinking... 5s' })).toBeTruthy();

    rerender(<AIThinking since={Date.now()} />);
    expect(screen.getByTestId('ai-reasoning')).toBe(view);
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();
  });

  it('turns the open chevron the other way in RTL', () => {
    const rotatedBy = (degrees: string) =>
      screen.UNSAFE_root.findAll((node) =>
        JSON.stringify(node.props?.style ?? '').includes(`"rotate":"${degrees}"`),
      ).length > 0;
    const originalIsRTL = I18nManager.isRTL;
    const setRTL = (value: boolean) =>
      Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value });

    try {
      setRTL(false);
      const { unmount } = renderWithTheme(<AIReasoning initiallyExpanded text='A thought' />);
      expect(rotatedBy('90deg')).toBe(true);
      unmount();

      setRTL(true);
      renderWithTheme(<AIReasoning initiallyExpanded text='A thought' />);
      expect(rotatedBy('-90deg')).toBe(true);
    } finally {
      setRTL(originalIsRTL);
    }
  });
});

describe('AIMessageParts', () => {
  const reasoning = (id: string, preview: string): AIMessagePartData => ({
    id,
    kind: 'ai_reasoning',
    payload: {},
    reasoning: { durationMs: 3000, id, preview, status: 'completed' },
    version: 1,
  });

  // Whether the step a view is of comes in: an entrance on the way up to the list of steps.
  const comesIn = (testID: string) => {
    let node = screen.getByTestId(testID).parent;
    while (node && node.props.testID !== 'ai-message-parts') {
      if (node.props.entering) return true;
      node = node.parent;
    }
    return false;
  };
  const call = (id: string): AIMessagePartData => ({
    id,
    kind: 'ai_tool_call',
    payload: {},
    toolCall: toolCall({ id }),
    version: 1,
  });

  it('brings in the steps of a reply being written, and shows those of one written before', () => {
    const { rerender } = renderWithTheme(
      <AIMessageParts isGenerating messageId='m1' parts={[call('c1')]} />,
    );
    expect(comesIn('ai-tool-call')).toBe(true);

    rerender(<AIMessageParts messageId='m1' parts={[call('c1')]} />);
    expect(comesIn('ai-tool-call')).toBe(true);

    renderWithTheme(<AIMessageParts messageId='m2' parts={[reasoning('r1', 'Done')]} />);
    expect(comesIn('ai-reasoning')).toBe(false);
  });

  it('shows at once the step that carries on the agent’s thinking', () => {
    const clock = new AIThinkingClock();
    clock.update('t1', true, false, false);
    renderWithTheme(
      <AIThinkingTurnContext.Provider value={{ clock, firstStepId: 'r1', key: 't1' }}>
        <AIMessageParts isGenerating messageId='m1' parts={[reasoning('r1', 'Hmm')]} />
      </AIThinkingTurnContext.Provider>,
    );
    expect(comesIn('ai-reasoning')).toBe(false);
  });

  it('updates its views for another message’s steps, each starting afresh', () => {
    const { rerender } = renderWithTheme(
      <AIMessageParts messageId='m1' parts={[reasoning('r1', 'First')]} />,
    );
    const view = screen.getByTestId('ai-reasoning');
    fireEvent.press(screen.getByRole('button', { name: /Thought for 3s/ }));
    expect(screen.getByText('First')).toBeTruthy();

    rerender(<AIMessageParts messageId='m2' parts={[reasoning('r1', 'Second')]} />);
    // The same view, not one built again, showing the other step folded.
    expect(screen.getByTestId('ai-reasoning')).toBe(view);
    expect(screen.getByRole('button', { expanded: false, name: /Thought for 3s/ })).toBeTruthy();
    expect(screen.queryByText('Second')).toBeNull();
  });
});
