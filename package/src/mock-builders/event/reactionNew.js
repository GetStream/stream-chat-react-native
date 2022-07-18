export default (client, reaction, message, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    message,
    reaction,
    type: 'reaction.new',
  });
};
