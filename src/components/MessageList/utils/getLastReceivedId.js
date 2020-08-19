export const getLastReceivedId = (messages) => {
  let lastReceivedId = null;

  for (let i = messages.length; i > 0; i--) {
    if (
      messages[i] !== undefined &&
      messages[i].status !== undefined &&
      messages[i].status === 'received'
    ) {
      lastReceivedId = messages[i].id;
      break;
    }
  }

  return lastReceivedId;
};
