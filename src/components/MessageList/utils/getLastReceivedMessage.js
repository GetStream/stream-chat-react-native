export const getLastReceivedMessage = (messages) => {
  let lastReceivedMessage = null;

  /**
   * There are no status on dates so they will be skipped
   */
  for (let i = 0; i < messages.length; i++) {
    if (
      messages[i] !== undefined &&
      messages[i].id !== undefined &&
      messages[i].status !== undefined &&
      messages[i].status === 'received'
    ) {
      lastReceivedMessage = messages[i];
      break;
    }
  }

  return lastReceivedMessage;
};
