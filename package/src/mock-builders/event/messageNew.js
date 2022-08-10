export default (client, newMessage, channel = {}) => {
  client.dispatchEvent({
    channel,
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    message: newMessage,
    type: 'message.new',
  });
};
