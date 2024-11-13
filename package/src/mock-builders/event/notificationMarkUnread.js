export default (client, channel = {}, payload = {}, user = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'notification.mark_unread',
    user,
    ...payload,
  });
};
