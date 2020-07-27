export default (client, message, channel = {}) => {
  client.dispatchEvent({
    type: 'message.deleted',
    cid: channel.cid,
    message,
    channel,
  });
};
