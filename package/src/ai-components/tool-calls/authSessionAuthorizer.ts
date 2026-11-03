import type { AIToolAuthorizer } from './AIToolApprover';

import type { AIToolAuthorizationData, AIToolCallPart } from '../message-parts/types';
import NativeAIAgent from '../native-specs/NativeAIAgent';

// The sign-in runs the router's launch page in the platform's web authentication session
// (`ASWebAuthenticationSession` on iOS, an Auth Tab or a Custom Tab on Android), with the
// handoff token in the page's fragment, which no server sees. The page goes to the provider,
// which sends the person back through the router to the session's return URL, on this app's
// scheme, with how it ended in the query. The counterpart of `AIWebAuthentication` in
// StreamChatAI and of `createPopupAuthorizer` on the web.

/** How the router says a consent ended, in the return URL's `status` query parameter. */
export type ConnectorSignInStatus = 'connected' | 'denied' | 'failed' | 'account_mismatch';

const OUTCOMES: readonly string[] = [
  'connected',
  'denied',
  'failed',
  'account_mismatch',
] satisfies ConnectorSignInStatus[];

const CONNECTION_ID = /^[\w-]{1,128}$/;

/** The sign-in's outcome, as the return URL says it. */
export type ConnectorSignInResult = {
  connectionId: string;
  status: ConnectorSignInStatus;
};

/**
 * Why a sign-in could not be opened: the call carries no sign-in, or the app was built without
 * the SDK's native code (`unavailable`), or the platform's session failed to open (`failed`).
 */
export class AIConnectorSignInError extends Error {
  readonly reason: 'failed' | 'unavailable';

  constructor(reason: AIConnectorSignInError['reason'], message?: string) {
    super(message ?? `The sign-in couldn't be opened (${reason}).`);
    this.name = 'AIConnectorSignInError';
    this.reason = reason;
  }
}

// The page reads its fragment as form parameters, where `+` is a space and `&` and `=` separate
// them, so a token carrying one of them is percent-encoded, as is everything else unsafe.
const fragmentValue = (value: string) => encodeURIComponent(value);

/**
 * The page to open for a sign-in: its `url` with the handoff token in the fragment. Read without
 * `URL`, whose parts throw on React Native before 0.80.
 */
export const signInLaunchUrl = ({ handoffToken, url }: AIToolAuthorizationData) => {
  if (!handoffToken) return url;
  const base = url.split('#')[0];
  return `${base}#handoff_token=${fragmentValue(handoffToken)}`;
};

/** Reads the router's redirect to the return URL: `…?connection_id=…&status=…`. */
export const readConnectorSignInResult = (returned: string): ConnectorSignInResult | null => {
  const query = returned.split('#')[0].split('?')[1] ?? '';
  const params: Record<string, string> = {};
  for (const pair of query.split('&')) {
    const [name, value = ''] = pair.split('=');
    if (!name) continue;
    try {
      params[decodeURIComponent(name)] = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      // A parameter that isn't valid percent-encoding is left out.
    }
  }
  const connectionId = params.connection_id ?? '';
  const status = params.status ?? '';
  if (!CONNECTION_ID.test(connectionId) || !OUTCOMES.includes(status)) return null;
  return { connectionId, status: status as ConnectorSignInStatus };
};

export type AuthSessionAuthorizerOptions = {
  /**
   * Your app's own URL scheme, such as `com.example.app`. It is the scheme of the return URL your
   * sessions give their sign-ins (`return_url`), which the sign-in comes back to.
   */
  callbackScheme: string;
  /**
   * Tells your backend the person won't sign in now. Your backend ends the call. A rejection lets
   * the person answer again.
   */
  decline: (call: AIToolCallPart) => Promise<void>;
};

export type AuthSessionAuthorizer = AIToolAuthorizer & { callbackScheme: string };

/**
 * An `AIToolAuthorizer` that opens a call's sign-in in the platform's web authentication session:
 * `ASWebAuthenticationSession` on iOS, and on Android the browser's Auth Tab, or a Custom Tab when
 * the browser has none.
 *
 * `connect` resolves `true` when the return URL says the account is connected, and `false` when
 * the person closed the sign-in or it ended otherwise. It rejects with an `AIConnectorSignInError`
 * when the sign-in couldn't be opened.
 */
export const createAuthSessionAuthorizer = ({
  callbackScheme,
  decline,
}: AuthSessionAuthorizerOptions): AuthSessionAuthorizer => {
  const connect = async (call: AIToolCallPart) => {
    const authorization = call.authorization;
    if (!authorization || !NativeAIAgent) throw new AIConnectorSignInError('unavailable');
    let returned: string;
    try {
      returned = await NativeAIAgent.openAuthSession(
        signInLaunchUrl(authorization),
        callbackScheme,
      );
    } catch (error) {
      throw new AIConnectorSignInError(
        'failed',
        error instanceof Error ? error.message : undefined,
      );
    }
    return returned !== '' && readConnectorSignInResult(returned)?.status === 'connected';
  };

  return { callbackScheme, connect, decline };
};
