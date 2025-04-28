export default (client, user, channel = {}) => {
  const newDate = new Date();
  const event = {
    channel,
    cid: channel.cid,
    created_at: newDate,
    received_at: newDate,
    type: 'message.read',
    user,
  };
  client.dispatchEvent(event);

  return event;
};
