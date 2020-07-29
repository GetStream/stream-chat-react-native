export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'notification.message_new',
    cid: channel.cid,
    channel,
  });
};
