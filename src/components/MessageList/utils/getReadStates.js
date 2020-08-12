export const getReadStates = (messages, read) => {
  // create object with empty array for each message id
  const readData = {};

  for (const message of messages) {
    // Filter out date seperators
    if (!message || !message.id) {
      continue;
    }
    readData[message.id] = [];
  }

  for (const readState of Object.values(read)) {
    if (readState.last_read == null) {
      break;
    }
    let userLastReadMsgId;
    for (const msg of messages) {
      if (msg.updated_at < readState.last_read) {
        userLastReadMsgId = msg.id;
      }
    }
    if (userLastReadMsgId) {
      readData[userLastReadMsgId] = [
        ...readData[userLastReadMsgId],
        readState.user,
      ];
    }
  }

  return readData;
};
