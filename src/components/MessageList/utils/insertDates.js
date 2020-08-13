export const insertDates = (messages) => {
  const newMessages = [];
  if (messages.length === 0) {
    return newMessages;
  }

  for (const [i, message] of messages.entries()) {
    if (message.type === 'message.read' || message.deleted_at) {
      newMessages.push(message);
      continue;
    }

    const messageDate = message.created_at.getDay();
    let prevMessageDate = messageDate;

    if (i < messages.length - 1) {
      prevMessageDate = messages[i + 1].created_at.getDay();
    }

    if (i === 0) {
      newMessages.push(
        {
          type: 'message.date',
          date: message.created_at,
        },
        message,
      );
    } else if (messageDate !== prevMessageDate) {
      newMessages.push(message, {
        type: 'message.date',
        date: messages[i + 1].created_at,
      });
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};
