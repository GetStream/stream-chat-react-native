export const getReadStates = (messages, read) => {
  const readData = {};

  for (const message of messages) {
    /**
     * Filter out date separators
     */
    if (!message?.id) {
      continue;
    }

    /**
     * Create empty array for each message id
     */
    readData[message.id] = [];
  }

  /**
   * Channel read state is stored by user
   */
  for (const readState of Object.values(read)) {
    /**
     * If no last read break
     */
    if (readState.last_read == null) {
      break;
    }

    /**
     * Find the last message before the last_read
     */
    let userLastReadMsgId;
    for (const msg of messages) {
      if (msg.updated_at < readState.last_read) {
        userLastReadMsgId = msg.id;
      }
    }

    /**
     * If there there is a last read message add the user
     * to the array of last reads for that message
     */
    if (userLastReadMsgId) {
      readData[userLastReadMsgId] = [
        ...readData[userLastReadMsgId],
        readState.user,
      ];
    }
  }

  return readData;
};
