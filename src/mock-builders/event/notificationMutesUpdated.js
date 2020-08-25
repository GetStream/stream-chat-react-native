export default (client, mutes = []) => {
  client.dispatchEvent({
    created_at: '2020-05-26T07:11:57.968294216Z',
    me: {
      ...client.user,
      channel_mutes: [],
      mutes,
    },
    type: 'notification.mutes_updated',
  });
};
