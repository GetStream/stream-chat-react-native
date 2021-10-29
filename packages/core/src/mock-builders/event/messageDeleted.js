export default (client, message, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    message,
    type: 'message.deleted',
  });
};
