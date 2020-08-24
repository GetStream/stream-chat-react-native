export default (client, newMessage, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    message: newMessage,
    type: 'message.new',
  });
};
