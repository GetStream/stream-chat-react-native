export default (client, mutes = []) => {
  client.dispatchEvent({
    type: 'notification.mutes_updated',
    created_at: '2020-05-26T07:11:57.968294216Z',
    me: {
      ...client.user,
      mutes,
      channel_mutes: [],
    },
  });
};
