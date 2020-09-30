When user focuses on input box, keyboard opens up on mobile devices. When keyboard opens, it is necessary to update the position of input box and height of content on screen
so that it doesn't get hidden behind keyboard. This is handled by [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx) which
is a HOC. It creates a context which contain following function.

- **dismissKeyboard** Dismisses the keyboard and adjusts the height of content on screen.
