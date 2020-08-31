export const getGroupStyles = ({ messagesWithDates, noGroupByUser }) => {
  const numberOfMessages = messagesWithDates.length;
  const messageGroupStyles = {};

  const messages = [...messagesWithDates];

  for (let i = 0; i < numberOfMessages; i++) {
    const previousMessage = messages[i - 1];
    const message = messages[i];
    const nextMessage = messages[i + 1];
    const groupStyles = [];

    /**
     * Skip event and date messages
     */
    if (message.type === 'channel.event') {
      continue;
    }

    if (message.type === 'message.date') {
      continue;
    }

    const userId = message.user ? message.user.id : null;

    /**
     * Determine top message
     */
    const isTopMessage =
      !previousMessage ||
      previousMessage.type === 'message.date' ||
      previousMessage.type === 'system' ||
      previousMessage.type === 'channel.event' ||
      (previousMessage.attachments &&
        previousMessage.attachments.length !== 0) ||
      userId !== previousMessage.user.id ||
      previousMessage.type === 'error' ||
      previousMessage.deleted_at;

    /**
     * Determine bottom message
     */
    const isBottomMessage =
      !nextMessage ||
      nextMessage.type === 'message.date' ||
      nextMessage.type === 'system' ||
      nextMessage.type === 'channel.event' ||
      (nextMessage.attachments && nextMessage.attachments.length !== 0) ||
      userId !== nextMessage.user.id ||
      nextMessage.type === 'error' ||
      nextMessage.deleted_at;

    /**
     * Add group styles key for top message
     */
    if (isTopMessage) {
      groupStyles.push('top');
    }

    /**
     * Add group styles key for bottom message
     */
    if (isBottomMessage) {
      /**
       * If the bottom message is also the top, or deleted, or an error,
       * add the key for single message instead of bottom
       */
      if (isTopMessage || message.deleted_at || message.type === 'error') {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      } else {
        groupStyles.push('bottom');
      }
    }

    /**
     * Add the key for all non top or bottom messages, if the message is
     * deleted or an error add the key for single otherwise middle
     */
    if (!isTopMessage && !isBottomMessage) {
      if (message.deleted_at || message.type === 'error') {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      } else {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('middle');
      }
    }

    /**
     * If there are attachments add the key for single
     */
    if (message.attachments.length !== 0) {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    }

    /**
     * If noGroupByUser set add the key for single
     */
    if (noGroupByUser) {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    }

    messageGroupStyles[message.id] = groupStyles;
  }

  return messageGroupStyles;
};
