import { useState, useEffect, useContext } from 'react';
import { TranslationContext } from '../../../context';

/**
 * Hook to set the display preview for latest message on channel.
 *
 * @param {*} channel Channel object
 *
 * @returns {object} latest message preview e.g.. { text: 'this was last message ...', created_at: '11/12/2020', messageObject: { originalMessageObject } }
 */
const useLatestMessagePreview = (channel) => {
  const [latestMessagePreview, setLatestMessagePreview] = useState({});
  const { t, tDateTimeParser } = useContext(TranslationContext);
  const getLatestMessageDisplayText = (message) => {
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

  const getLatestMessageDisplayDate = (message) => {
    if (tDateTimeParser(message.created_at).isSame(new Date(), 'day'))
      return tDateTimeParser(message.created_at).format('LT');
    else {
      return tDateTimeParser(message.created_at).format('L');
    }
  };

  useEffect(() => {
    if (!channel.state.messages || channel.state.messages.length === 0) {
      setLatestMessagePreview({
        text: '',
        created_at: '',
        messageObject: {},
      });

      return;
    }

    const message = channel.state.messages[channel.state.messages.length - 1];

    setLatestMessagePreview({
      text: getLatestMessageDisplayText(message),
      created_at: getLatestMessageDisplayDate(message),
      messageObject: { ...message },
    });
  }, [channel]);

  return latestMessagePreview;
};

export default useLatestMessagePreview;
