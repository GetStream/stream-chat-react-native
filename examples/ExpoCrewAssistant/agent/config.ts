/**
 * Where the Vision-Agents router and the crew backend are, and who this app is. Set in
 * `.env.local`, which `.env.example` describes. Only public values belong there: Expo inlines every
 * `EXPO_PUBLIC_` variable into the bundle, so the Stream secret stays with the backend.
 */

const streamApiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;

if (!streamApiKey) {
  throw new Error(
    'EXPO_PUBLIC_STREAM_API_KEY is not set: copy .env.example to .env.local and fill it in.',
  );
}

export const AgentConfig = {
  /** The Stream app the router runs in. Its channels hold the conversations. */
  streamApiKey,
  /** The router. On an Android emulator, `adb reverse tcp:8080 tcp:8080` makes localhost reach it. */
  routerUrl: process.env.EXPO_PUBLIC_AGENT_ROUTER_URL || 'http://localhost:8080',
  /**
   * The crew backend (`crew_assistant/backend`): it mints this user's Stream token, holds the
   * restaurant's schedule, handbook, equipment and leaders' inbox, and makes the agent speak first.
   */
  backendUrl: process.env.EXPO_PUBLIC_CREW_BACKEND_URL || 'http://localhost:8097',
  /** The customer `go run ./configure` stored the agent under. */
  customerId: process.env.EXPO_PUBLIC_AGENT_CUSTOMER_ID || 'examples',
  /** The agent, by the name in its `agent.yaml`. */
  agentName: process.env.EXPO_PUBLIC_AGENT_NAME || 'crew_assistant',
  user: {
    id: process.env.EXPO_PUBLIC_AGENT_USER_ID || 'crew-jordan',
    name: 'Jordan Lee',
  },
} as const;
