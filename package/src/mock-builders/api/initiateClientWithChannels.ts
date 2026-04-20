import type { Channel, StreamChat, UserResponse } from 'stream-chat';

import { getOrCreateChannelApi } from './getOrCreateChannel';
import { useMockedApis } from './useMockedApis';

import { generateChannel } from '../generator/channel';
import { generateMember } from '../generator/member';
import { generateUser } from '../generator/user';
import { getTestClientWithUser } from '../mock';

type ChannelData = Record<string, unknown>;

const initChannelFromData = async ({
  channelData,
  client,
  defaultGenerateChannelOptions,
}: {
  channelData: ChannelData;
  client: StreamChat;
  defaultGenerateChannelOptions: ChannelData;
}): Promise<Channel> => {
  const mockedChannelData = generateChannel({
    ...defaultGenerateChannelOptions,
    ...channelData,
  });

  useMockedApis(client, [getOrCreateChannelApi(mockedChannelData)]);
  const channel = client.channel(mockedChannelData.channel.type, mockedChannelData.channel.id);
  await channel.watch();
  jest.spyOn(channel, 'getConfig').mockImplementation(() => mockedChannelData.channel.config);
  // jest
  //   .spyOn(channel, 'getDraft')
  //   .mockImplementation(() => generateMessageDraft({ channel_cid: channel.cid }));
  return channel;
};

export const initiateClientWithChannels = async ({
  channelsData,
  customUser,
}: {
  channelsData?: ChannelData[];
  customUser?: UserResponse;
} = {}): Promise<{ channels: Channel[]; client: StreamChat }> => {
  const user = customUser || generateUser();
  const client = await getTestClientWithUser(user);

  const defaultGenerateChannelOptions = {
    members: [generateMember({ user })],
  };
  const channels = await Promise.all(
    (channelsData ?? [defaultGenerateChannelOptions]).map((channelData) =>
      initChannelFromData({ channelData, client, defaultGenerateChannelOptions }),
    ),
  );

  return { channels, client };
};
