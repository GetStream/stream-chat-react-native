# [React Native](https://getstream.io/chat/react-native-chat/tutorial/) AI components for Stream Chat

This official repository for Stream Chat's UI components is designed specifically for AI-first applications written in Swift UI. When paired with our real-time [Chat API](https://getstream.io/chat/), it makes integrating with and rendering responses from LLM providers such as ChatGPT, Gemini, Anthropic or any custom backend easier by providing rich with out-of-the-box components able to render Markdown, Code blocks, tables, thinking indicators, images, etc.

To start, this library includes the following components which assist with this task:
- `StreamingMessageView` - a component that is able to render text, markdown and code in real-time, using a typewriter, character-by-character animation, similar to ChatGPT
- `ComposerView` - a fully featured prompt composer with attachments and speech input
- `SpeechToTextButton` - a reusable button that records voice input and streams the recognized transcript back into your UI
- `AITypingIndicatorView` - a component that can display different states of the LLM (thinking, checking external sources, etc)

Our team plans to keep iterating and adding more components over time. If there's a component you use every day in your apps and would like to see added, please open an issue and we will take it into consideration.

## 🛠️ Installation

The `@stream-io/ai-components-react-native` SDK is available on NPM.

To install it and its peer dependencies, you may run the following command:

```bash
yarn add @stream-io/ai-components-react-native react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg victory-native @shopify/react-native-skia @babel/plugin-proposal-export-namespace-from
```

After this finishes, you'll need to add the respective `babel` plugins to your `babel.config.js` file, like so:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... rest of your @babel plugins
    '@babel/plugin-proposal-export-namespace-from',
    // react-native-worklets/plugin has to be the last one
    'react-native-worklets/plugin',
  ],
};
```

Finally, in order for the speech-to-text feature to work you will need toa add the required capabilities.

#### `iOS`

Within `Info.plist`:

```txt
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) would like to access your microphone to capture your voice.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>$(PRODUCT_NAME) would like to access speech recognition to transcribe your voice.</string>
```

The text you pick for the capabilities is up to you.

#### `Android`

Within `android/app/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Optional features

Additionally, you may also include the optional dependencies that enable pluggable features.

### Media Picker

The media picker feature allows you to pick existing images and take photos with your camera and then use them directly.

The SDK has built-in support for 2 libraries that allow you to achieve this:

#### `react-native-image-picker`

This RN CLI library is meant to be used in vanilla React Native projects. 

To install it, you can run: 

```bash
yarn add react-native-image-picker
```

Please note that for the image capture capabilities to work, you'll also need to include the following permissions:

`Info.plist`:

```txt
<key>NSCameraUsageDescription</key>
<string>$(PRODUCT_NAME) would like to use your camera to share an image in a message.</string>
```

`AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

respectively.

#### `expo-image-picker`

This `Expo` library is meant to be used in `Expo` projects.

To install it, you can run:

```bash
npx expo install expo-image-picker
```

Then, you can refer to [their documentation about adding permissions](https://docs.expo.dev/versions/latest/sdk/imagepicker/#example-appjson-with-config-plugin) and add the `photosPermission` and `cameraPermission` fields.

### Clipboard

The clipboard feature allows you to copy the code within markdown codeblocks if they are rendered.

The SDK has built-in support for 2 libraries that allow you to achieve this:

- `@react-native-clipboard/clipboard` (for RN CLI apps)
- `expo-clipboard` (for `Expo` apps)

## ⚙️ Usage

All of the components listed below are designed to work seamlessly with our existing React Native [Chat SDK](https://getstream.io/chat/react-native-chat/tutorial/). Our [developer guide](https://getstream.io/chat/solutions/ai-integration/) explains how to get started building AI integrations with Stream.

In order to use them, they have to be wrapped within our `StreamTheme` provider that will make sure theming is applied to them. It is recommended that you put the provider somewhere high up in the component tree so that it encapsulates all components used downstream.

### `StreamingMessageView`

The `StreamingMessageView` is a component that can render markdown content efficiently. It has code syntax highlighting, supporting all the major languages. It can render most of the standard markdown content, such as tables, inline code, headings, lists etc.

Under the hood, it implements a letter-by-letter typewriter animation with a character queue, similar to ChatGPT.

| Name                         | Type                                                                                                                                                               | Required | Description                                                                                                                                                                                                                                                                                                                                                                   |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `text`                       | `string`                                                                                                                                                           | yes      | The text we want to pass as markdown.                                                                                                                                                                                                                                                                                                                                         |
| `paragraphTextNumberOfLines` | `boolean`                                                                                                                                                          | no       | A boolean signifying if `numberOfLines` should be applied as a property to markdown `Paragraph` and `Text` components. Particularly useful if we want to display the same message, but in a "cut" fashion (for example when replying to someone).                                                                                                                             |
| `rules`                      | [`MarkdownRules`](https://github.com/GetStream/ai-components-js/blob/11314d5b7e888ed4585e6c4790eb173e928be6b3/packages/react-native-sdk/src/markdown/types.ts#L24) | no       | An object of `MarkdownRules` that is then going to be deeply merged with our default rules, based on the [`SimpleMarkdown` parsing engine](https://github.com/Khan/perseus/tree/main/packages/simple-markdown#adding-a-simple-extension). Can be used to add custom rules or change existing rules. You can disable a rule by passing `{ [ruleName]: { match: () => null }}`. |
| `onLink`                     | `(url: string) => void`                                                                                                                                            | no       | A function that is going to be invoked whenever a link is pressed within markdown parsed text.                                                                                                                                                                                                                                                                                |
| `letterInterval`             | `number`                                                                                                                                                           | no       | A number signifying the interval at which the typewriter animation is going to render characters. Defaults to `0`                                                                                                                                                                                                                                                             |
| `renderingLetterCount`       | `number`                                                                                                                                                           | no       | A number signifying the number of letters that are going to be rendered per tick of the interval during the typewriter animation. Defaults to `2`                                                                                                                                                                                                                             |

#### Example

Provided below is an example of how to use the component.

```tsx
const markdownText = ```
# Heading

some text

## Another heading
```;

<StreamingMessageView 
  text={markdownText}
  letterInterval={5} // every 5ms
  renderingLetterCount={3} // render 3 letters at a time
/>
```
### `AITypingIndicatorView`

The `AITypingIndicatorView` is used to represent different states of the LLM, such as `Thinking`, `Checking External Sources` and so on, depending on the states you've defined on your backend. The only thing that needs to be passed to the component is the `text` property, which will then be displayed with a shimmering animation.


| Name    | Type     | Required | Description                                          |
|---------|----------|----------|------------------------------------------------------|
| `text`  | `string` | yes      | The text we want to be displayed inside of the view. |

#### Example

```tsx
<AITypingIndivacorView text={'Thinking of an answer...'} />
```

### `ComposerView`

The `ComposerView` gives users a modern text entry surface with attachment previews, actionable bottom sheet, speech-to-text button and an integrated send button.


| Name                 | Type                                                                                                                                                                                        | Required | Description                                                                                                                                                                                                                                                                    |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `onSendMessage`      | `(opts: { text: string; attachments?: MediaPickerState['assets']; custom?: Record<string, unknown>; }) => Promise<void>`                                                                    | yes      | A callback that will be invoked whenever the send button is pressed. The `text`, `attachments` and any `custom` data we've added to the state will be passed to it.                                                                                                            |
| `bottomSheetOptions` | [`BottomSheetOption[]`](https://github.com/GetStream/ai-components-js/blob/11314d5b7e888ed4585e6c4790eb173e928be6b3/packages/react-native-sdk/src/message-composer/MessageComposer.tsx#L19) | no       | An array of [`BottomSheetOption`](https://github.com/GetStream/ai-components-js/blob/11314d5b7e888ed4585e6c4790eb173e928be6b3/packages/react-native-sdk/src/message-composer/MessageComposer.tsx#L19) objects that will render the extra options in the bottom sheet.          |
| `bottomSheetInsets`  | `{ top: number; bottom: number; left: number; right: number }`                                                                                                                              | no       | An object containing extra insets we can pass to the `ComposerView` in order to make sure the bottom sheet can extend properly beyond them.                                                                                                                                    |
| `isGenerating`       | `boolean`                                                                                                                                                                                   | no       | A boolean signifying whether the LLM is currently generating a response or not. It will be used to render the stop-generating button in the composer instead of the send button whenever this happens.                                                                         |
| `stopGenerating`     | `() => Promise<void>`                                                                                                                                                                       | no       | A callback that is going to be invoked if the stop-generating button is clicked.                                                                                                                                                                                               |
| `mediaPickerService` | `AbstractMediaPickerService`                                                                                                                                                                | no       | An instance of the `MediaPickerService` we may decide to inject from the outside for more fine-grained control over attachment state. You can create an instance as `const customInstance = MediaPickerService()` and it will automatically detect which library you're using. |
| `state`              | `StateStore<ComposerState>`                                                                                                                                                                 | no       | A state store of the `ComposerState` we may decide to inject from the outside for more fine-grained control over the composer state. You can create an instance as `const customComposerState = createNewComposerStore()`.                                                     |

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
  }
]

const insets = useSafeAreaInsets();

<ComposerView
  onSendMessage={sendMessage}
  bottomSheetOptions={bottomSheetOptions}
  bottomSheetInsets={insets}
/>
```

### `SpeechToTextButton`

The `SpeechToTextButton` turns voice input into text using native implementations of the iOS and Android speech frameworks, respectively. When tapped it asks for microphone access, records audio and forwards the recognized transcript to the `ComposerState` directly.

It uses the `useDictation` hook under the hood, which can also be used without the button as well for voice transcription purposes outside of the button.

It takes a single property named `options` that has the following keys:

| Name                  | Type       | Required | Description                                                                                                                                                                        |
|-----------------------|------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `language`            | `string`   | no       | The language we want to transcribe from. It will default to `en-US`.                                                                                                               |
| `intermediateResults` | `boolean`  | no       | A boolean signifying whether we want to receive the intermediate results from the transcription or just the final result when the transcription is deemed done. Defaults to `true` |
| `silenceTimeoutMs`    | `number`   | no       | A number signifying the number of milliseconds of silence until transcription is deemed finished. Defaults to `2500`.                                                              |


```tsx
const options = {
  language: 'de-DE', // set the language to german
  intermediateResults: false, // disable intermediate results and only use the final results
  silenceTimeoutMs: 3500 // set the silence timeout to 3.5 seconds
}
<SpeechToTextButton options={options} />
```

The `SpeechToTextButton` is already integrated within the `ComposerView`, however feel free to use it elsewhere as well.

### Theming

Each one of the components in the SDK is fully theme-compatible. The `StreamTheme` provider takes care of this for you.

In order to modify the theme, you may refer to our full fledged theme object [as seen here](https://github.com/GetStream/ai-components-js/blob/main/packages/react-native-sdk/src/theme.ts).

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

<br />

<a href="https://getstream.io?utm_source=Github&utm_medium=Github_Repo_Content&utm_content=Developer&utm_campaign=Github_Swift_AI_SDK&utm_term=DevRelOss">
<img src="https://user-images.githubusercontent.com/24237865/138428440-b92e5fb7-89f8-41aa-96b1-71a5486c5849.png" align="right" width="12%"/>
</a>

## 🛥 What is Stream?

Stream allows developers to rapidly deploy scalable feeds, chat messaging and video with an industry leading 99.999% uptime SLA guarantee.

Stream provides UI components and state handling that make it easy to build real-time chat and video calling for your app. Stream runs and maintains a global network of edge servers around the world, ensuring optimal latency and reliability regardless of where your users are located.

## 📕 Tutorials

To learn more about integrating AI and chatbots into your application, we recommend checking out the full list of tutorials across all of our supported frontend SDKs and providers. Stream's Chat SDK is natively supported across:
* [React](https://getstream.io/chat/react-chat/tutorial/)
* [React Native](https://getstream.io/chat/react-native-chat/tutorial/)
* [Angular](https://getstream.io/chat/angular/tutorial/)
* [Jetpack Compose](https://getstream.io/tutorials/android-chat/)
* [SwiftUI](https://getstream.io/tutorials/ios-chat/)
* [Flutter](https://getstream.io/chat/flutter/tutorial/)
* [Javascript/Bring your own](https://getstream.io/chat/docs/javascript/)


## 👩‍💻 Free for Makers 👨‍💻

Stream is free for most side and hobby projects. To qualify, your project/company needs to have < 5 team members and < $10k in monthly revenue. Makers get $100 in monthly credit for video for free.
For more details, check out the [Maker Account](https://getstream.io/maker-account?utm_source=Github&utm_medium=Github_Repo_Content&utm_content=Developer&utm_campaign=Github_Swift_AI_SDK&utm_term=DevRelOss).

## 💼 We are hiring!

We've closed a [\$38 million Series B funding round](https://techcrunch.com/2021/03/04/stream-raises-38m-as-its-chat-and-activity-feed-apis-power-communications-for-1b-users/) in 2021 and we keep actively growing.
Our APIs are used by more than a billion end-users, and you'll have a chance to make a huge impact on the product within a team of the strongest engineers all over the world.
Check out our current openings and apply via [Stream's website](https://getstream.io/team/#jobs).


## License

```
Copyright (c) 2014-2024 Stream.io Inc. All rights reserved.

Licensed under the Stream License;
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   https://github.com/GetStream/stream-chat-swift-ai/blob/main/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
