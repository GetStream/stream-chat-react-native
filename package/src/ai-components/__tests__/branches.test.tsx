import React, { type ReactElement } from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { AIBranchSwitcher, AIReplyActions, AIUserMessage, StreamTheme } from '../index';

jest.mock('../services/clipboard-service', () => ({ setClipboardString: jest.fn() }));

const renderView = (ui: ReactElement) => render(ui, { wrapper: StreamTheme });

const previous = () => screen.getByRole('button', { name: 'Previous version' });
const next = () => screen.getByRole('button', { name: 'Next version' });
const switcher = (name: string) => screen.getByLabelText(name);

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
