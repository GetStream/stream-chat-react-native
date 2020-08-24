export const getLastReceivedId = (messages) => {
  const l = messages.length;
  let lastReceivedId = null;

  for (let i = l; i > 0; i--) {
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
