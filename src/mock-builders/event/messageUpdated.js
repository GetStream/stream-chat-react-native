export default (client, newMessage, channel = {}) => {
  client.dispatchEvent({
    type: 'message.updated',
    cid: channel.cid,
    message: newMessage,
    channel,
  });
};
