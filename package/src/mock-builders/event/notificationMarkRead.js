export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'notification.mark_read',
  });
};
