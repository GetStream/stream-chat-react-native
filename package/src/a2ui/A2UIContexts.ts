import { createContext } from 'react';

import type { A2UIEngine } from './A2UIRenderer';

/** The engine of the surfaces below, for what in them reaches the host, such as links. */
export const A2UIEngineContext = createContext<A2UIEngine | undefined>(undefined);

/** The reply the surfaces below belong to, and whether the agent is still writing it. */
export const A2UIReplyContext = createContext<
  { isStreaming: boolean; messageId: string } | undefined
>(undefined);
