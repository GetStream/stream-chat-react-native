export const insertDates = (messages) => {
  const newMessages = [];
  if (messages.length === 0) {
    return newMessages;
  }

  for (const [i, message] of messages.entries()) {
    /**
     * If message read or deleted don't consider for date labels
     */
    if (message.type === 'message.read' || message.deleted_at) {
      newMessages.push(message);
      continue;
    }

    /**
     * Get the date of the current message and create
     * variable for previous date (day)
     */
    const messageDate = message.created_at.getDay();
    let prevMessageDate = messageDate;

    /**
     * If this is not the last entry in the messages array
     * set the previous message date (day) to the date of the next
     * message in the array
     */
    if (i < messages.length - 1) {
      prevMessageDate = messages[i + 1].created_at.getDay();
    }

    /**
     * Before the first message insert a date object
     */
    if (i === 0) {
      newMessages.push(
        {
          date: message.created_at,
          type: 'message.date',
        },
        message,
      );

      /**
       * If the date (day) has changed between two messages
       * insert a date object
       */
    } else if (messageDate !== prevMessageDate) {
      newMessages.push(message, {
        date: messages[i + 1].created_at,
        type: 'message.date',
      });

      /**
       * Otherwise just add the message
       */
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};
