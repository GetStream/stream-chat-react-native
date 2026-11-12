import {
  isAuthorizationExpired,
  isAwaitingApproval,
  isAwaitingAuthorization,
  isAwaitingClient,
  isDeclined,
  isSupportedPart,
  isToolCallFinished,
  parseMessagePart,
  parseMessageParts,
} from '../message-parts';
import type { AIToolCallPart } from '../message-parts';

// Shaped as the router writes them (acceleration/internal/conversation/parts.go).
const reasoning = {
  duration_ms: 4200,
  finished_at: '2026-11-02T10:00:04Z',
  id: 'r1',
  preview: 'Let me check the calendar first.',
  started_at: '2026-11-02T10:00:00Z',
  status: 'completed',
  summary: 'Checked the calendar',
  type: 'ai_reasoning',
  v: 1,
};

const approvalCall = {
  approval: {
    allow_title: 'Share',
    decline_title: 'Not now',
    message: 'Only your city is shared.',
    reason: 'to check the local weather',
    title: 'Share your location?',
  },
  arguments: { reason: 'to check the local weather' },
  display_title: 'Checking your location',
  executor: 'client',
  id: 'call_1',
  name: 'get_location',
  status: 'awaiting_approval',
  target_client_id: 'ios-1',
  target_user_id: 'alex',
  type: 'ai_tool_call',
  v: 1,
};

const authorizationCall = {
  authorization: {
    expires_at: '2026-11-02T10:10:00.123Z',
    handoff_token: 'tok',
    message: 'The agent needs your Linear account to file the issue.',
    provider: 'linear',
    provider_name: 'Linear',
    title: 'Connect Linear',
    type: 'oauth',
    url: 'https://router.example.com/v1/agents/connectors/oauth/launch/abc',
  },
  display_title: 'Filing a Linear issue',
  executor: 'server',
  id: 'call_2',
  name: 'linear_create_issue',
  status: 'awaiting_authorization',
  target_user_id: 'alex',
  type: 'ai_tool_call',
  v: 1,
};

const signInWithUrl = (url: string) =>
  parseMessagePart({
    ...authorizationCall,
    authorization: { ...authorizationCall.authorization, url },
  })?.toolCall?.authorization;

describe('parseMessageParts', () => {
  it('reads the steps in order and skips other attachments', () => {
    const parts = parseMessageParts([
      reasoning,
      { image_url: 'https://example.com/a.png', type: 'image' },
      approvalCall,
      authorizationCall,
    ]);
    expect(parts.map((part) => part.id)).toEqual(['r1', 'call_1', 'call_2']);
    expect(parts.map((part) => part.kind)).toEqual([
      'ai_reasoning',
      'ai_tool_call',
      'ai_tool_call',
    ]);
    expect(parts.every(isSupportedPart)).toBe(true);
  });

  it('reads a reply as a local Vision-Agents router wrote it', () => {
    // The attachments of one real reply, copied from the channel (2026-11-03, xai/grok-4.7).
    const parts = parseMessageParts([
      {
        duration_ms: 2387,
        finished_at: '2026-11-03T14:20:45.15695058Z',
        id: 'r1',
        preview: "Searching for today's top tech headline.",
        started_at: '2026-11-03T14:20:45.156092748Z',
        status: 'completed',
        summary: "Searching for today's top tech headline.",
        type: 'ai_reasoning',
        v: 1,
      },
      {
        display_title: 'Searching the web',
        duration_ms: 687,
        executor: 'server',
        finished_at: '2026-11-03T14:20:45.844631174Z',
        id: 'call-b1352079-bc55-4229-ab07-8f9c2fc5d4d7-0',
        name: 'search',
        started_at: '2026-11-03T14:20:45.15688333Z',
        status: 'completed',
        type: 'ai_tool_call',
        v: 1,
      },
      {
        duration_ms: 1884,
        finished_at: '2026-11-03T14:20:47.729154697Z',
        id: 'r2',
        preview: "I will search for today's top tech headline and summarize it in one sentence.",
        started_at: '2026-11-03T14:20:47.72908728Z',
        status: 'completed',
        summary: "I will search for today's top tech headline and summarize it in one sentence.",
        type: 'ai_reasoning',
        v: 1,
      },
    ]);
    expect(parts.map((part) => part.id)).toEqual([
      'r1',
      'call-b1352079-bc55-4229-ab07-8f9c2fc5d4d7-0',
      'r2',
    ]);
    expect(parts[0].reasoning).toEqual({
      durationMs: 2387,
      id: 'r1',
      preview: "Searching for today's top tech headline.",
      status: 'completed',
      summary: "Searching for today's top tech headline.",
    });
    expect(parts[1].toolCall).toMatchObject({
      displayTitle: 'Searching the web',
      durationMs: 687,
      executor: 'server',
      name: 'search',
      status: 'completed',
    });
    expect(parts.every(isSupportedPart)).toBe(true);
  });

  it('reads the fields stream-chat keeps under custom', () => {
    const [part] = parseMessageParts([
      {
        custom: { duration_ms: 1200, id: 'r1', status: 'completed', summary: 'Checked', v: 1 },
        type: 'ai_reasoning',
      },
    ]);
    expect(part).toMatchObject({ id: 'r1', kind: 'ai_reasoning', version: 1 });
    expect(part.payload).toMatchObject({ id: 'r1', status: 'completed', type: 'ai_reasoning' });
    expect(part.reasoning).toMatchObject({
      durationMs: 1200,
      status: 'completed',
      summary: 'Checked',
    });
  });

  it('reads a reasoning step', () => {
    expect(parseMessagePart(reasoning)?.reasoning).toEqual({
      durationMs: 4200,
      id: 'r1',
      preview: 'Let me check the calendar first.',
      status: 'completed',
      summary: 'Checked the calendar',
    });
  });

  it('reads a tool call with its approval', () => {
    const call = parseMessagePart(approvalCall)?.toolCall;
    expect(call).toMatchObject({
      approval: {
        allowTitle: 'Share',
        declineTitle: 'Not now',
        message: 'Only your city is shared.',
        reason: 'to check the local weather',
        title: 'Share your location?',
      },
      arguments: { reason: 'to check the local weather' },
      displayTitle: 'Checking your location',
      executor: 'client',
      id: 'call_1',
      name: 'get_location',
      status: 'awaiting_approval',
      targetClientId: 'ios-1',
      targetUserId: 'alex',
    });
  });

  it('reads a tool call with its authorization', () => {
    const call = parseMessagePart(authorizationCall)?.toolCall;
    expect(call?.authorization).toEqual({
      expiresAt: Date.parse('2026-11-02T10:10:00.123Z'),
      handoffToken: 'tok',
      message: 'The agent needs your Linear account to file the issue.',
      provider: 'linear',
      providerName: 'Linear',
      status: undefined,
      title: 'Connect Linear',
      type: 'oauth',
      url: 'https://router.example.com/v1/agents/connectors/oauth/launch/abc',
    });
  });

  it('defaults missing fields', () => {
    const part = parseMessagePart({ type: 'ai_tool_call' }, 3);
    expect(part?.id).toBe('ai_tool_call-3');
    expect(part?.version).toBe(1);
    expect(part?.toolCall).toMatchObject({
      executor: 'server',
      name: '',
      status: 'running',
    });
    expect(parseMessagePart({ type: 'ai_reasoning' })?.reasoning?.status).toBe('completed');
  });

  it('reads fields of the wrong type as missing', () => {
    const call = parseMessagePart({
      approval: { message: 'no title' },
      authorization: { title: 'Connect', url: 'ftp://example.com/launch' },
      duration_ms: '12',
      id: 7,
      name: ['x'],
      status: '',
      type: 'ai_tool_call',
    })?.toolCall;
    expect(call).toMatchObject({ durationMs: undefined, id: 'ai_tool_call-0', name: '' });
    expect(call?.status).toBe('running');
    // a question with no title asks nothing, and a sign-in needs a web page
    expect(call?.approval).toBeUndefined();
    expect(call?.authorization).toBeUndefined();
  });

  it('opens a sign-in only on a web page with a host', () => {
    expect(
      signInWithUrl('http://localhost:8080/v1/agents/connectors/oauth/launch/abc'),
    ).toBeDefined();
    expect(signInWithUrl('HTTPS://router.example.com')).toBeDefined();
    expect(signInWithUrl('https://user@router.example.com/launch')).toBeDefined();
    expect(signInWithUrl('https://')).toBeUndefined();
    expect(signInWithUrl('https:///launch')).toBeUndefined();
    expect(signInWithUrl('javascript:alert(1)')).toBeUndefined();
    expect(signInWithUrl('router.example.com/launch')).toBeUndefined();
  });

  it('reads a sign-in where URL does not implement protocol or host', () => {
    // React Native before 0.80 throws "not implemented" from these getters.
    const OriginalURL = globalThis.URL;
    class LimitedURL {
      get host(): string {
        throw new Error('URL.host is not implemented');
      }
      get protocol(): string {
        throw new Error('URL.protocol is not implemented');
      }
    }
    globalThis.URL = LimitedURL as unknown as typeof URL;
    try {
      expect(parseMessagePart(authorizationCall)?.toolCall?.authorization).toBeDefined();
    } finally {
      globalThis.URL = OriginalURL;
    }
  });

  it('keeps steps it cannot read, without a typed view', () => {
    const newer = parseMessagePart({ id: 'x', type: 'ai_tool_call', v: 2 });
    expect(newer?.toolCall).toBeUndefined();
    expect(newer && isSupportedPart(newer)).toBe(false);
    const custom = parseMessagePart({ id: 'c', type: 'ai_citation', url: 'u' });
    expect(custom?.kind).toBe('ai_citation');
    expect(custom?.payload).toMatchObject({ url: 'u' });
    expect(custom && isSupportedPart(custom)).toBe(false);
  });

  it('ignores what is not an AI step', () => {
    expect(parseMessageParts(undefined)).toEqual([]);
    expect(parseMessageParts([null, 'x', { type: 'file' }, {}])).toEqual([]);
  });
});

describe('tool call addressing', () => {
  const call = (overrides: Partial<AIToolCallPart>): AIToolCallPart => ({
    ...(parseMessagePart(approvalCall)?.toolCall as AIToolCallPart),
    ...overrides,
  });

  it('asks the targeted person on the targeted install', () => {
    expect(isAwaitingApproval(call({}), 'alex', 'ios-1')).toBe(true);
    expect(isAwaitingApproval(call({}), 'alex', 'android-2')).toBe(false);
    expect(isAwaitingApproval(call({}), 'sam', 'ios-1')).toBe(false);
  });

  it('asks a server tool on any of the person’s installs', () => {
    const server = call({ executor: 'server', targetClientId: undefined });
    expect(isAwaitingApproval(server, 'alex', 'ios-1')).toBe(true);
    expect(isAwaitingApproval(server, 'alex', 'android-9')).toBe(true);
  });

  it('asks nothing once answered or without a question', () => {
    expect(isAwaitingApproval(call({ status: 'running' }), 'alex', 'ios-1')).toBe(false);
    expect(isAwaitingApproval(call({ approval: undefined }), 'alex', 'ios-1')).toBe(false);
  });

  it('waits for this device to run a client tool', () => {
    const device = call({ status: 'awaiting_client' });
    expect(isAwaitingClient(device, 'alex', 'ios-1')).toBe(true);
    expect(isAwaitingClient(device, 'alex', 'ios-2')).toBe(false);
    expect(isAwaitingClient(call({ executor: 'server' }), 'alex', 'ios-1')).toBe(false);
  });

  it('asks the targeted person to sign in from any install', () => {
    const signIn = parseMessagePart(authorizationCall)?.toolCall as AIToolCallPart;
    expect(isAwaitingAuthorization(signIn, 'alex')).toBe(true);
    expect(isAwaitingAuthorization(signIn, 'sam')).toBe(false);
    expect(isAwaitingAuthorization({ ...signIn, status: 'completed' }, 'alex')).toBe(false);
  });

  it('knows a declined call', () => {
    const declinedApproval = call({
      approval: { decision: 'declined', title: 'Share?' },
      status: 'cancelled',
    });
    expect(isDeclined(declinedApproval)).toBe(true);
    const signIn = parseMessagePart(authorizationCall)?.toolCall as AIToolCallPart;
    expect(
      isDeclined({
        ...signIn,
        authorization: { ...signIn.authorization!, status: 'declined' },
      }),
    ).toBe(true);
    expect(isDeclined(call({}))).toBe(false);
  });

  it('knows finished statuses and expired sign-ins', () => {
    expect(['completed', 'failed', 'cancelled'].every(isToolCallFinished)).toBe(true);
    expect(isToolCallFinished('awaiting_client')).toBe(false);
    const signIn = parseMessagePart(authorizationCall)?.toolCall?.authorization as NonNullable<
      AIToolCallPart['authorization']
    >;
    expect(isAuthorizationExpired(signIn, signIn.expiresAt! - 1)).toBe(false);
    expect(isAuthorizationExpired(signIn, signIn.expiresAt!)).toBe(true);
    expect(isAuthorizationExpired({ ...signIn, status: 'connected' }, Infinity)).toBe(false);
  });
});
