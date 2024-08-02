import React from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';
import {
  useChatContext,
  MessageTextProps,
  DefaultStreamChatGenerics,
} from 'stream-chat-react-native';
import type { TranslationLanguages } from 'stream-chat';

const MessageText = (props: MessageTextProps<DefaultStreamChatGenerics>) => {
  const {
    markdownRules,
    message,
    messageOverlay,
    messageTextNumberOfLines,
    onLongPress,
    onlyEmojis,
    onPress,
    renderText,
    theme,
    preventPress,
  } = props;
  const { client } = useChatContext();

  const {
    theme: {
      colors,
      messageSimple: {
        content: {
          markdown,
          textContainer: { onlyEmojiMarkdown },
        },
      },
    },
  } = theme;

  const translatedMessage = useMemo(() => {
    const translationKey: `${TranslationLanguages}_text` = 'nl_text';

    if (
      message?.i18n &&
      message?.i18n?.language !== 'nl' &&
      translationKey in message?.i18n &&
      message.type !== 'deleted'
    ) {
      return {
        ...message,
        text: message.i18n[translationKey],
      };
    }

    return null;
  }, [message]);

  if (!message?.text) {
    return null;
  }

  const isMyMessage = client && message && client.userID === message.user?.id;

  const markdownStyles = {
    ...markdown,
    text: isMyMessage ? { ...markdown.text, color: 'white' } : markdown.text,
  };

  return (
    <>
      {renderText({
        colors,
        markdownRules,
        markdownStyles: {
          ...markdownStyles,
          ...(onlyEmojis ? onlyEmojiMarkdown : {}),
        },
        message,
        messageOverlay,
        messageTextNumberOfLines,
        onLongPress,
        onlyEmojis,
        onPress,
        preventPress,
      })}

      {translatedMessage && (
        <>
          <View style={{ backgroundColor: '#52be80', height: 1 }} />
          {renderText({
            colors: { ...colors, overlay: 'transparent' },
            markdownRules,
            markdownStyles: {
              ...markdownStyles,
              ...(onlyEmojis ? onlyEmojiMarkdown : {}),
            },
            message: translatedMessage,
            messageOverlay,
            messageTextNumberOfLines,
            onLongPress,
            onlyEmojis,
            onPress,
            preventPress,
          })}
        </>
      )}
    </>
  );
};

export default MessageText;
