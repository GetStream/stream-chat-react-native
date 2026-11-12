# ExpoChatGPTSample

A ChatGPT-style assistant built with [`stream-chat-expo`](../../package/expo-package) and its AI components
(`stream-chat-expo/ai-components`): streamed markdown answers with syntax highlighting, tables and charts, an "AI is
thinking" indicator, and a composer with attachments, a custom actions sheet and speech-to-text.

Ported from the `ExpoChatGPTSample` of the deprecated `@stream-io/chat-react-native-ai` repository
([`GetStream/ai-components-js`](https://github.com/GetStream/ai-components-js)).

## How it works

The agent runs on a [Vision-Agents](https://github.com/GetStream/Vision-Agents) router, which the app talks to through
[`@stream-io/stream-agents`](https://www.npmjs.com/package/@stream-io/stream-agents) (`agent/`).

- Each conversation is a router session, kept in an `agent` channel. The drawer lists the user's `agent` channels. `+`
  starts a new session, and one that is never asked anything is deleted when you leave it.
- The conversation is `AIConversation`, over an `AIConversationController` that `contexts/AppContext.tsx` builds from
  the SDK's `AgentChat` and `agentChatTransport` (`@stream-io/stream-agents/chat`). `AgentChat` watches the channel,
  loads older pages, keeps each reply's full reasoning from its live updates, and follows what the agent is doing on
  the session's socket. The controller offers no edit or regenerate: the router can't rewind a conversation.
- Asking goes through the session, not the chat composer. The router writes the question and the streamed reply into
  the channel, the reply's steps as `ai_reasoning` and `ai_tool_call` attachments, and titles the conversation itself.
  Photos go as data URIs, and "Think harder" as a high reasoning effort. The phone's tools (`agent/deviceTools.ts`) are
  declared on the session, which runs them.
- The keyboard is handled by the AI components through `react-native-keyboard-controller`; the app only wraps itself
  in `KeyboardProvider`. The starters and the voice button sit in the composer's `header`, so they ride the keyboard.

## Running

1. Run a Vision-Agents router locally, with its `swift_assistant` agent and token backend, as in
   [`examples/voice_agents/swift_assistant`](https://github.com/GetStream/Vision-Agents/tree/accelerate/examples/voice_agents/swift_assistant):
   `docker compose up` (with `ROUTER_AUTH_MODE=proxy`), `go run ./configure`, then `go run ./backend`. The chat model
   is Grok, so the router needs `XAI_API_KEY`.
2. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_STREAM_API_KEY` to the Stream app the router runs in.
3. On an Android emulator, forward the ports: `adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8098 tcp:8098`.
4. From the repository root:

```bash
yarn install
yarn workspace expochatgptsample ios      # or: android
```

`ios` and `android` sync the SDK's shared native code, run `expo prebuild` and build the app. The native `ios` and
`android` folders are generated and not committed.

On iOS, if the app crashes at launch in `dyld` with a missing symbol, reinstall the pods without Expo's
precompiled modules: `cd ios && EXPO_USE_PRECOMPILED_MODULES=0 pod install`, then build again.
