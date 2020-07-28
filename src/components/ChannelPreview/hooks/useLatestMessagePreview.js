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

/**
 * Hook to set the display preview for latest message on channel.
 *
 * @param {*} channel Channel object
 *
 * @returns {object} latest message preview e.g.. { text: 'this was last message ...', created_at: '11/12/2020', messageObject: { originalMessageObject } }
 */
export const useLatestMessagePreview = (channel) => {
  const { t, tDateTimeParser } = useContext(TranslationContext);
  const [latestMessagePreview, setLatestMessagePreview] = useState({});

  useEffect(() => {
    if (!channel.state.messages || !channel.state.messages.length) {
      setLatestMessagePreview({
        created_at: '',
        messageObject: {},
        text: '',
      });
    } else {
      const message = channel.state.messages[channel.state.messages.length - 1];

      setLatestMessagePreview({
        created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
        messageObject: { ...message },
        text: getLatestMessageDisplayText(message, t),
      });
    }
  }, [channel]);

  return latestMessagePreview;
};
