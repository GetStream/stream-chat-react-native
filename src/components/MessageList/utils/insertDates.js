export const insertDates = (messages, eventHistory) => {
  const newMessages = [];
  if (messages.length === 0) {
    eventHistory &&
      eventHistory.none &&
      eventHistory.none.forEach((e) => {
        newMessages.push({
          type: 'channel.event',
          event: e,
        });
      });

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

    const eventsNextToMessage = eventHistory?.[message.id];
    if (eventsNextToMessage && eventsNextToMessage.length > 0) {
      eventsNextToMessage.forEach((e) => {
        newMessages.push({
          type: 'channel.event',
          event: e,
        });
      });
    }
  }

  return newMessages;
};
