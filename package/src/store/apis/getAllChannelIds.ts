import { selectChannels } from './queries/selectChannels';

export const getAllChannelIds = () => {
  const channels = selectChannels();

  return channels.map((c) => c.cid);
};
