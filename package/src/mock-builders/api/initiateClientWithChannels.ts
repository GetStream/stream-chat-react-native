import type { Channel, ChannelConfigWithInfo, StreamChat, UserResponse } from 'stream-chat';

import { getOrCreateChannelApi } from './getOrCreateChannel';
import { useMockedApis } from './useMockedApis';

import { generateChannel } from '../generator/channel';
import { generateMember } from '../generator/member';
import { generateUser } from '../generator/user';
import { getTestClientWithUser } from '../mock';

type ChannelData = Parameters<typeof generateChannel>[0];

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
  const channel = client.channel(mockedChannelData.type, mockedChannelData.id);
  await channel.watch();
  // Written into the client's store rather than stubbed onto the channel. `getConfig()` is gone, and its
  // replacement `channel.serverConfig` is a getter over this store — `jest.spyOn` cannot stand in for an
  // accessor. Going through the store also drives the channel's own derivation, so `channel.config` (where
  // the server's gates are ANDed with anything registered through `client.config`) is correct too, which a
  // stub would have left stale. Keyed by cid, matching the LLC: a channel's own `config_overrides` narrow
  // its type's settings for that channel alone.
  client.channelServerConfigsStore.partialNext({
    configs: {
      ...client.channelServerConfigs,
      [channel.cid]: mockedChannelData.channel.config as ChannelConfigWithInfo,
    },
  });
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
