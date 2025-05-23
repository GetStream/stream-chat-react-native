export default (client, user, channel = {}, payload = {}) => {
  const newDate = new Date();
  const event = {
    channel,
    cid: channel.cid,
    created_at: newDate,
    received_at: newDate,
    type: 'message.read',
    user,
    ...payload,
  };
  client.dispatchEvent(event);

  return event;
};
