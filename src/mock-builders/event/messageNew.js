export default (client, newMessage, channel = {}) => {
  client.dispatchEvent({
    type: 'message.new',
    cid: channel.cid,
    message: newMessage,
    channel,
  });
};
