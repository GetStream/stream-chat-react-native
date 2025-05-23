export default (client, channel = {}, payload = {}, user = {}) => {
  const newDate = new Date();
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    created_at: newDate,
    received_at: newDate,
    type: 'notification.mark_unread',
    user,
    ...payload,
  });
};
