import React, { type ReactElement } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIClientIdentity,
  AIConnectorSignInError,
  AIMessagePart,
  type AIToolApprover,
  AIToolApproverProvider,
  AIToolAuthorization,
  AIToolAuthorizationCard,
  type AIToolAuthorizer,
  type AIToolCallPart,
  createAuthSessionAuthorizer,
  parseMessagePart,
  readConnectorSignInResult,
  signInLaunchUrl,
  StreamTheme,
} from '../index';
import NativeAIAgent from '../native-specs/NativeAIAgent';

jest.mock('../native-specs/NativeAIAgent', () => ({
  __esModule: true,
  default: { installId: jest.fn(), openAuthSession: jest.fn() },
}));

const native = NativeAIAgent as unknown as {
  installId: jest.Mock;
  openAuthSession: jest.Mock;
};

const renderWithTheme = (ui: ReactElement) => {
  const result = render(<StreamTheme>{ui}</StreamTheme>);
  return {
    ...result,
    rerender: (next: ReactElement) => result.rerender(<StreamTheme>{next}</StreamTheme>),
  };
};

const signIn = parseMessagePart({
  authorization: {
    handoff_token: 'tok',
    provider: 'linear',
    provider_name: 'Linear',
    title: 'Connect Linear',
    type: 'oauth',
    url: 'https://router.example.com/launch/abc',
  },
  id: 'call_2',
  name: 'linear_create_issue',
  status: 'awaiting_authorization',
  target_user_id: 'alex',
  type: 'ai_tool_call',
})?.toolCall as AIToolCallPart;

const approverWith = (authorizer?: AIToolAuthorizer): AIToolApprover => ({
  authorizer,
  clientId: 'ios-1',
  decide: jest.fn(() => Promise.resolve()),
  userId: 'alex',
});

describe('AIToolAuthorization', () => {
  it('asks nothing without an authorizer, or of another person', () => {
    const { rerender } = renderWithTheme(
      <AIToolAuthorization approver={approverWith()} part={signIn} />,
    );
    expect(screen.queryByText('Connect Linear')).toBeNull();
    rerender(
      <AIToolAuthorization
        approver={{ ...approverWith({ connect: jest.fn(), decline: jest.fn() }), userId: 'sam' }}
        part={signIn}
      />,
    );
    expect(screen.queryByText('Connect Linear')).toBeNull();
  });

  it('connects, and lets the person try again when the sign-in ends unconnected', async () => {
    let finish: (connected: boolean) => void = () => undefined;
    const connect = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithTheme(
      <AIToolAuthorization
        approver={approverWith({ connect, decline: jest.fn() })}
        part={signIn}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
    expect(connect).toHaveBeenCalledWith(signIn);
    expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled();
    // Not now stays available while the sign-in is open.
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();

    await act(async () => {
      finish(false);
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });

  it('declines a sign-in the person closed, which cannot be opened again', async () => {
    const decline = jest.fn(() => Promise.reject(new Error('offline')));
    renderWithTheme(
      <AIToolAuthorization
        approver={approverWith({ connect: () => Promise.resolve('closed'), decline })}
        part={signIn}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(decline).toHaveBeenCalledWith(signIn);

    // As with "Not now", an answer that couldn't be sent can be given again.
    await act(() => Promise.resolve());
    expect(screen.getByText("Your answer couldn't be sent. Try again.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  it('keeps connecting once connected, until the step changes', async () => {
    renderWithTheme(
      <AIToolAuthorization
        approver={approverWith({ connect: () => Promise.resolve(true), decline: jest.fn() })}
        part={signIn}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled();
  });

  it('says when the sign-in could not open, and lets the person try again', async () => {
    const connect = jest.fn(() => Promise.reject(new AIConnectorSignInError('failed')));
    renderWithTheme(
      <AIToolAuthorization
        approver={approverWith({ connect, decline: jest.fn() })}
        part={signIn}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(screen.getByText("The sign-in couldn't be opened. Try again.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });

  it('declines, and lets the person answer again when that fails', async () => {
    const decline = jest.fn(() => Promise.reject(new Error('offline')));
    renderWithTheme(
      <AIToolAuthorization
        approver={approverWith({ connect: jest.fn(), decline })}
        part={signIn}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(decline).toHaveBeenCalledWith(signIn);
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDisabled();
    await act(() => Promise.resolve());
    expect(screen.getByText("Your answer couldn't be sent. Try again.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  it.each([
    ['connected', 'Connected to Linear'],
    ['declined', 'Not connected'],
    ['failed', "The sign-in didn't complete."],
    ['expired', 'This sign-in has expired.'],
  ])('says how a %s sign-in ended, without buttons', (status, outcome) => {
    renderWithTheme(
      <AIToolAuthorizationCard
        authorization={{ ...signIn.authorization!, status }}
        onConnect={jest.fn()}
        onDecline={jest.fn()}
      />,
    );
    expect(screen.getByText(outcome)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
  });

  it('can no longer be opened past its expiry', () => {
    renderWithTheme(
      <AIToolAuthorizationCard
        authorization={{ ...signIn.authorization!, expiresAt: Date.now() - 1 }}
        onConnect={jest.fn()}
        onDecline={jest.fn()}
      />,
    );
    expect(screen.getByText('This sign-in has expired.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  it('is asked under its tool call, with the approver of the provider', () => {
    renderWithTheme(
      <AIToolApproverProvider approver={approverWith({ connect: jest.fn(), decline: jest.fn() })}>
        <AIMessagePart part={parseMessagePart({ ...signInAttachment, type: 'ai_tool_call' })!} />
      </AIToolApproverProvider>,
    );
    expect(screen.getByText('Connect Linear')).toBeTruthy();
    expect(screen.getByText('Waiting for you to sign in')).toBeTruthy();
  });
});

const signInAttachment = {
  authorization: {
    handoff_token: 'tok',
    provider: 'linear',
    title: 'Connect Linear',
    type: 'oauth',
    url: 'https://router.example.com/launch/abc',
  },
  id: 'call_3',
  name: 'linear_list_issues',
  status: 'awaiting_authorization',
  target_user_id: 'alex',
};

describe('createAuthSessionAuthorizer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('puts the handoff token in the launch page’s fragment, encoded', () => {
    expect(signInLaunchUrl({ ...signIn.authorization!, handoffToken: 'a+b&c=d/e' })).toBe(
      'https://router.example.com/launch/abc#handoff_token=a%2Bb%26c%3Dd%2Fe',
    );
    expect(signInLaunchUrl({ ...signIn.authorization!, handoffToken: undefined })).toBe(
      'https://router.example.com/launch/abc',
    );
  });

  it('opens the sign-in for the app’s scheme, and reads how it ended', async () => {
    const decline = jest.fn(() => Promise.resolve());
    const authorizer = createAuthSessionAuthorizer({ callbackScheme: 'myapp', decline });

    native.openAuthSession.mockResolvedValueOnce(
      'myapp://signed-in?connection_id=c1&status=connected',
    );
    await expect(authorizer.connect(signIn)).resolves.toBe(true);
    expect(native.openAuthSession).toHaveBeenCalledWith(
      'https://router.example.com/launch/abc#handoff_token=tok',
      'myapp',
    );

    native.openAuthSession.mockResolvedValueOnce(
      'myapp://signed-in?connection_id=c1&status=denied',
    );
    await expect(authorizer.connect(signIn)).resolves.toBe(false);

    // The person closed the sheet: the sign-in can't be opened again.
    native.openAuthSession.mockResolvedValueOnce('');
    await expect(authorizer.connect(signIn)).resolves.toBe('closed');

    await authorizer.decline(signIn);
    expect(decline).toHaveBeenCalledWith(signIn);
  });

  it('lets a closed sign-in be tried again with declineOnClose off', async () => {
    const authorizer = createAuthSessionAuthorizer({
      callbackScheme: 'myapp',
      decline: jest.fn(),
      declineOnClose: false,
    });
    native.openAuthSession.mockResolvedValueOnce('');
    await expect(authorizer.connect(signIn)).resolves.toBe(false);
  });

  it('rejects when the sign-in could not be opened', async () => {
    const authorizer = createAuthSessionAuthorizer({ callbackScheme: 'myapp', decline: jest.fn() });

    native.openAuthSession.mockRejectedValueOnce(new Error('No browser'));
    await expect(authorizer.connect(signIn)).rejects.toMatchObject({
      message: 'No browser',
      reason: 'failed',
    });
    await expect(authorizer.connect({ ...signIn, authorization: undefined })).rejects.toMatchObject(
      { reason: 'unavailable' },
    );
  });

  it('reads only an outcome the router sends', () => {
    expect(readConnectorSignInResult('myapp://x?status=connected&connection_id=conn-1')).toEqual({
      connectionId: 'conn-1',
      status: 'connected',
    });
    expect(readConnectorSignInResult('myapp://x?status=maybe&connection_id=conn-1')).toBeNull();
    expect(readConnectorSignInResult('myapp://x?status=connected')).toBeNull();
    expect(readConnectorSignInResult('myapp://x')).toBeNull();
  });
});

describe('AIClientIdentity', () => {
  it('is the install id the native module keeps', () => {
    native.installId.mockReturnValue('ios-ABC');
    expect(AIClientIdentity.installId()).toBe('ios-ABC');
  });

  it('lives in memory, unchanged, when the native module has none', () => {
    native.installId.mockImplementation(() => {
      throw new Error('not linked');
    });
    const first = AIClientIdentity.installId();
    expect(first).toMatch(/^(ios|android)-[0-9a-f]{32}$/);
    expect(AIClientIdentity.installId()).toBe(first);
  });
});
