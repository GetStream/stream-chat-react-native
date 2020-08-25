export default (client, user, channel = {}) => {
  const event = {
    channel,
    cid: channel.cid,
    received_at: new Date(),
    type: 'message.read',
    user,
  };
  client.dispatchEvent(event);

  return event;
};
