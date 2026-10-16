# AI components for Stream Chat React Native

`stream-chat-react-native/ai-components` (and `stream-chat-expo/ai-components`) contains Stream Chat's UI components for AI-first applications. Paired with the [Chat API](https://getstream.io/chat/), they render responses from LLM providers such as ChatGPT, Gemini, Anthropic or any custom backend: Markdown, code blocks with syntax highlighting, tables, charts, thinking indicators and more.

- `StreamingMessageView` - renders text, markdown and code in real time, using a ChatGPT-like typewriter animation
- `ComposerView` - a prompt composer with attachments and speech input
- `SpeechToTextButton` - records voice input and streams the recognized transcript into your UI
- `AITypingIndicatorView` - displays the state of the LLM (thinking, checking external sources, etc.)

The components live in their own entry point. Apps that never import `stream-chat-react-native/ai-components` do not bundle any of it, and apps that only use the AI components do not bundle the rest of the chat SDK.

## Migrating from `@stream-io/chat-react-native-ai`

These components used to ship as the standalone `@stream-io/chat-react-native-ai` package, which is now deprecated. Their API is unchanged; to migrate:

1. Uninstall `@stream-io/chat-react-native-ai` and import from `stream-chat-react-native/ai-components` (or `stream-chat-expo/ai-components`) instead:

   ```diff
   - import { ComposerView, StreamingMessageView } from '@stream-io/chat-react-native-ai';
   + import { ComposerView, StreamingMessageView } from 'stream-chat-react-native/ai-components';
   ```

2. Dictation is now opt-in on iOS (see [Dictation](#dictation-speech-to-text)): add `$StreamChatEnableDictation = true` to your `Podfile`, or, with Expo, replace the `@stream-io/chat-react-native-ai` config plugin with `stream-chat-expo`.
3. Keep the `export-namespace-from` Babel plugin (see [Installation](#️-installation)); it is needed by the `zod` dependency.
4. `ShimmeringView` and `toHexFromRNColor` were removed. `AITypingIndicatorView` now uses the SDK's native shimmer, so `@shopify/react-native-skia` is only needed for charts.
5. `SpeechToTextButton` and `isDictationAvailable` are now exported.

## 🛠️ Installation

The AI components ship with `stream-chat-react-native` and `stream-chat-expo`; their JavaScript dependencies are installed with them. Charts additionally need the following peer dependencies, which only apps using the AI components have to install:

```bash
yarn add victory-native @shopify/react-native-skia
```

`react-native-reanimated`, `react-native-gesture-handler` and `react-native-svg` are already required by the chat SDK.

The `zod` dependency ships `export * as` syntax, which the React Native Babel preset does not transform, so add the `export-namespace-from` plugin to your `babel.config.js`:

```bash
yarn add -D @babel/plugin-transform-export-namespace-from
```

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... rest of your @babel plugins
    '@babel/plugin-transform-export-namespace-from',
    // react-native-worklets/plugin has to be the last one
    'react-native-worklets/plugin',
  ],
};
```

Apps that do not import the AI components do not bundle `zod` and do not need the plugin.

### Dictation (speech-to-text)

The speech-to-text button uses the platform speech recognizers.

#### `iOS`

Because App Store Connect requires a speech recognition usage description from every app whose binary references the Speech framework, the dictation module is only compiled into apps that opt in. Add this to your `Podfile`, before `use_native_modules!`, and run `pod install`:

```ruby
$StreamChatEnableDictation = true
```

(`STREAM_CHAT_ENABLE_DICTATION=1 pod install` works as well.) Then add the usage descriptions to your `Info.plist`:

```txt
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) would like to access your microphone to capture your voice.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>$(PRODUCT_NAME) would like to access speech recognition to transcribe your voice.</string>
```

The text you pick for the capabilities is up to you. Without the opt-in the speech-to-text button is hidden, and a development-only warning explains how to enable it.

#### `Android`

Add the permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

#### `Expo`

Add the `stream-chat-expo` config plugin to your `app.json`/`app.config.[js|ts]`. It enables the dictation module and adds the permissions (with default descriptions unless you provide your own):

```json
"plugins": [
  // ... rest of your plugins
  [
    "stream-chat-expo",
    {
      "dictationMicrophoneUsageDescription": "$(PRODUCT_NAME) would like to access your microphone to capture your voice.",
      "dictationSpeechRecognitionUsageDescription": "$(PRODUCT_NAME) would like to access speech recognition to transcribe your voice."
    }
  ]
],
```

Pass `"enableDictation": false` to leave dictation out.

## Optional features

### Media Picker

The media picker of the `ComposerView` picks existing images and takes photos with the camera. It works with whichever of these libraries you have installed:

- `react-native-image-picker` (React Native CLI). For the camera, add `NSCameraUsageDescription` to your `Info.plist` and the `android.permission.CAMERA` permission to your `AndroidManifest.xml`.
- `expo-image-picker` (Expo). See the [Expo documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) for its permissions.

### Clipboard

The copy button of code blocks works with whichever of these libraries you have installed:

- `@react-native-clipboard/clipboard` (React Native CLI)
- `expo-clipboard` (Expo)

### Syntax highlighting on Android

On Android with the New Architecture, highlighted code is rendered by a native `PerfText` view: a single text view with colour spans instead of one `Text` per token, which keeps long code blocks cheap to render and scroll. Elsewhere, code is rendered with nested `Text`.

## ⚙️ Usage

All of the components listed below are designed to work seamlessly with our existing React Native [Chat SDK](https://getstream.io/chat/react-native-chat/tutorial/). Our [developer guide](https://getstream.io/chat/solutions/ai-integration/) explains how to get started building AI integrations with Stream.

In order to use them, they have to be wrapped within our `StreamTheme` provider that will make sure theming is applied to them. It is recommended that you put the provider somewhere high up in the component tree so that it encapsulates all components used downstream.

### `StreamingMessageView`

The `StreamingMessageView` is a component that can render markdown content efficiently. It has code syntax highlighting, supporting all the major languages. It can render most of the standard markdown content, such as tables, inline code, headings, lists etc.

Under the hood, it implements a letter-by-letter typewriter animation with a character queue, similar to ChatGPT.

| Name                     | Type                                   | Required | Description                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                   | `string`                               | yes      | The text we want to pass as markdown.                                                                                                                                                                                                                                                                                                                                         |
| `paragraphNumberOfLines` | `number`                               | no       | The `numberOfLines` applied to markdown `Paragraph` and `Text` components. Particularly useful if we want to display the same message, but in a "cut" fashion (for example when replying to someone).                                                                                                                                                                         |
| `rules`                  | [`MarkdownRules`](./markdown/types.ts) | no       | An object of `MarkdownRules` that is then going to be deeply merged with our default rules, based on the [`SimpleMarkdown` parsing engine](https://github.com/Khan/perseus/tree/main/packages/simple-markdown#adding-a-simple-extension). Can be used to add custom rules or change existing rules. You can disable a rule by passing `{ [ruleName]: { match: () => null }}`. |
| `onLink`                 | `(url: string) => void`                | no       | A function that is going to be invoked whenever a link is pressed within markdown parsed text.                                                                                                                                                                                                                                                                                |
| `letterInterval`         | `number`                               | no       | A number signifying the interval at which the typewriter animation is going to render characters. Defaults to `0`                                                                                                                                                                                                                                                             |
| `renderingLetterCount`   | `number`                               | no       | A number signifying the number of letters that are going to be rendered per tick of the interval during the typewriter animation. Defaults to `2`                                                                                                                                                                                                                             |

#### Example

Provided below is an example of how to use the component.

````tsx
const markdownText = ```
# Heading

some text

## Another heading
```;

<StreamingMessageView
  text={markdownText}
  letterInterval={5} // every 5ms
  renderingLetterCount={3} // render 3 letters at a time
/>;
````

### `AITypingIndicatorView`

The `AITypingIndicatorView` is used to represent different states of the LLM, such as `Thinking`, `Checking External Sources` and so on, depending on the states you've defined on your backend. The only thing that needs to be passed to the component is the `text` property, which will then be displayed with a shimmering animation.

| Name   | Type     | Required | Description                                          |
| ------ | -------- | -------- | ---------------------------------------------------- |
| `text` | `string` | yes      | The text we want to be displayed inside of the view. |

#### Example

```tsx
<AITypingIndivacorView text={'Thinking of an answer...'} />
```

### `ComposerView`

The `ComposerView` gives users a modern text entry surface with attachment previews, actionable bottom sheet, speech-to-text button and an integrated send button.

| Name                 | Type                                                                                                                     | Required | Description                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onSendMessage`      | `(opts: { text: string; attachments?: MediaPickerState['assets']; custom?: Record<string, unknown>; }) => Promise<void>` | yes      | A callback that will be invoked whenever the send button is pressed. The `text`, `attachments` and any `custom` data we've added to the state will be passed to it.                                                                                                            |
| `bottomSheetOptions` | [`BottomSheetOption[]`](./message-composer/ComposerView.tsx)                                                             | no       | An array of [`BottomSheetOption`](./message-composer/ComposerView.tsx) objects that will render the extra options in the bottom sheet.                                                                                                                                         |
| `bottomSheetInsets`  | `{ top: number; bottom: number; left: number; right: number }`                                                           | no       | An object containing extra insets we can pass to the `ComposerView` in order to make sure the bottom sheet can extend properly beyond them.                                                                                                                                    |
| `isGenerating`       | `boolean`                                                                                                                | no       | A boolean signifying whether the LLM is currently generating a response or not. It will be used to render the stop-generating button in the composer instead of the send button whenever this happens.                                                                         |
| `stopGenerating`     | `() => Promise<void>`                                                                                                    | no       | A callback that is going to be invoked if the stop-generating button is clicked.                                                                                                                                                                                               |
| `mediaPickerService` | `AbstractMediaPickerService`                                                                                             | no       | An instance of the `MediaPickerService` we may decide to inject from the outside for more fine-grained control over attachment state. You can create an instance as `const customInstance = MediaPickerService()` and it will automatically detect which library you're using. |
| `state`              | `StateStore<ComposerState>`                                                                                              | no       | A state store of the `ComposerState` we may decide to inject from the outside for more fine-grained control over the composer state. You can create an instance as `const customComposerState = createNewComposerStore()`.                                                     |

#### Example

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const options = [
  {
    title: 'Create Image',
    subtitle: 'Visualize anything',
    action: () => Alert.alert('Pressed on Create Image !'),
    Icon: DownloadArrow,
  },
  {
    title: 'Thinking',
    subtitle: 'Think longer for better answers',
    action: () => Alert.alert('Pressed on Thinking !'),
    Icon: Flag,
  },
];

const insets = useSafeAreaInsets();

<ComposerView onSendMessage={sendMessage} bottomSheetOptions={bottomSheetOptions} bottomSheetInsets={insets} />;
```

### `SpeechToTextButton`

The `SpeechToTextButton` turns voice input into text using native implementations of the iOS and Android speech frameworks, respectively. When tapped it asks for microphone access, records audio and forwards the recognized transcript to the `ComposerState` directly.

It uses the `useDictation` hook under the hood, which can also be used without the button as well for voice transcription purposes outside of the button.

It takes a single property named `options` that has the following keys:

| Name               | Type      | Required | Description                                                                                                                                                                        |
| ------------------ | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language`         | `string`  | no       | The language we want to transcribe from. It will default to `en-US`.                                                                                                               |
| `interimResults`   | `boolean` | no       | A boolean signifying whether we want to receive the intermediate results from the transcription or just the final result when the transcription is deemed done. Defaults to `true` |
| `silenceTimeoutMs` | `number`  | no       | A number signifying the number of milliseconds of silence until transcription is deemed finished. Defaults to `2500`.                                                              |

```tsx
const options = {
  language: 'de-DE', // set the language to german
  interimResults: false, // disable intermediate results and only use the final results
  silenceTimeoutMs: 3500 // set the silence timeout to 3.5 seconds
}
<SpeechToTextButton options={options} />
```

The `SpeechToTextButton` is already integrated within the `ComposerView`, however feel free to use it elsewhere as well. It renders nothing when dictation is not part of the build (see [Dictation](#dictation-speech-to-text)); `isDictationAvailable()` tells you whether it is.

### Theming

Each one of the components in the SDK is fully theme-compatible. The `StreamTheme` provider takes care of this for you.

In order to modify the theme, you may refer to our full fledged theme object [as seen here](./theme.ts).

#### Example

In the example below, we introduce a dark color scheme through the theming system.

```tsx
const customTheme = {
  colors: colorScheme === 'dark'
    ? {
      accent_blue: '#4C9DFF',
      accent_red: '#FF636E',
      black: '#FFFFFF',
      code_block: '#1E1E22',
      grey: '#A1A1AA',
      grey_neutral: '#C5C5C8',
      grey_dark: '#71717A',
      grey_gainsboro: '#3F3F46',
      grey_whisper: '#27272F',
      overlay: '#000000CC',
      transparent: 'transparent',
      white: '#050509',
      white_smoke: '#121214',
      shimmer: '#FFFFFF',
    } : {}
}

<StreamTheme style={customTheme}>{children}</StreamTheme>
```
