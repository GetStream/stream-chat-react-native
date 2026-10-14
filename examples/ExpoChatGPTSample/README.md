# ExpoChatGPTSample

A ChatGPT-style assistant built with [`stream-chat-expo`](../../package/expo-package) and its AI components
(`stream-chat-expo/ai-components`): streamed markdown answers with syntax highlighting, tables and charts, an "AI is
thinking" indicator, and a composer with attachments, a custom actions sheet and speech-to-text.

Ported from the `ExpoChatGPTSample` of the deprecated `@stream-io/chat-react-native-ai` repository
([`GetStream/ai-components-js`](https://github.com/GetStream/ai-components-js)).

## How it works

- The drawer lists the user's conversations; `+` starts a new one.
- A new conversation is created on its first message. Its title is summarized from that message by the sample backend.
- Before sending, the app asks the sample backend to add an AI agent to the channel (`http/requests.ts`). The agent
  replies with streamed `ai_generated` messages, rendered by `StreamingMessageView`.

The Stream app, user and backend in `chatConfig.ts` and `http/requests.ts` are Stream's public demo setup. To use your
own, replace them and point `http/requests.ts` at your own AI agent server.

## Running

From the repository root:

```bash
yarn install
yarn workspace expochatgptsample ios      # or: android
```

`ios` and `android` sync the SDK's shared native code, run `expo prebuild` and build the app. The native `ios` and
`android` folders are generated and not committed.
