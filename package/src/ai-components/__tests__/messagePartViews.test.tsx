import React, { type ReactElement } from 'react';
import { I18nManager } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIMessagePart,
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

  it('asks only the targeted person on the targeted install', () => {
    const decide = jest.fn(() => Promise.resolve());
    const { rerender } = renderWithTheme(<AIToolApproval part={asking} />);
    expect(screen.queryByText('Share your location?')).toBeNull();
    rerender(<AIToolApproval approver={{ ...approver(decide), userId: 'sam' }} part={asking} />);
    expect(screen.queryByText('Share your location?')).toBeNull();
    rerender(<AIToolApproval approver={approver(decide)} part={asking} />);
    expect(screen.getByText('Share your location?')).toBeTruthy();
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

  it('says Thinking... for thinking that shows nothing yet', () => {
    renderWithTheme(<AIThinking />);
    expect(screen.getByRole('button', { expanded: false, name: 'Thinking...' })).toBeTruthy();
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
