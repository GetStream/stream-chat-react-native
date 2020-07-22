export default (client, user, channel = {}) => {
  const event = {
    type: 'message.read',
    cid: channel.cid,
    channel,
    user,
    received_at: new Date(),
  };
  client.dispatchEvent(event);

  return event;
};
