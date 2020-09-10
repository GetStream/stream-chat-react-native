import { useContext, useEffect, useState } from 'react';

import { TranslationContext } from '../../../context';

const getLatestMessageDisplayText = (message, t) => {
  if (!message) {
    return t('Nothing yet...');
  }
  if (message.deleted_at) {
    return t('Message deleted');
  }
  if (message.text) {
    return message.text;
  }
  if (message.command) {
    return '/' + message.command;
  }
  if (message.attachments.length) {
    return t('🏙 Attachment...');
  }
  return t('Empty message...');
};

const getLatestMessageDisplayDate = (message, tDateTimeParser) => {
  if (tDateTimeParser(message.created_at).isSame(new Date(), 'day'))
    return tDateTimeParser(message.created_at).format('LT');
  else {
    return tDateTimeParser(message.created_at).format('L');
  }
};

const getLatestMessagePreview = (channel, t, tDateTimeParser) => {
  const messages = channel && channel.state && channel.state.messages;

  if (!messages || !messages.length) {
    return {
      created_at: '',
      messageObject: {},
      text: '',
    };
  } else {
    const message = messages[messages.length - 1];

    return {
      created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
      messageObject: { ...message },
      text: getLatestMessageDisplayText(message, t),
    };
  }
};

/**
 * Hook to set the display preview for latest message on channel.
 *
 * @param {*} channel Channel object
 *
 * @returns {object} latest message preview e.g.. { text: 'this was last message ...', created_at: '11/12/2020', messageObject: { originalMessageObject } }
 */
export const useLatestMessagePreview = (channel, lastMessage) => {
  const { t, tDateTimeParser } = useContext(TranslationContext);
  const [latestMessagePreview, setLatestMessagePreview] = useState(
    getLatestMessagePreview(channel, t, tDateTimeParser),
  );

  useEffect(() => {
    setLatestMessagePreview(
      getLatestMessagePreview(channel, t, tDateTimeParser),
    );
  }, [channel, lastMessage]);

  return latestMessagePreview;
};
