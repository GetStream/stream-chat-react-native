import { SharedLocationResponseData } from 'stream-chat';

import { selectActiveLocationsForChannels } from './queries/selectActiveLocationsForChannels';

import { mapStorableToSharedLocation } from '../mappers/mapStorableToSharedLocation';

export const getChannelActiveLocations = async ({
  channelIds,
}: {
  channelIds: string[];
}): Promise<Record<string, SharedLocationResponseData[]>> => {
  const cidVsLiveLocations: Record<string, SharedLocationResponseData[]> = {};

  // Active means `endAt` is set and in the future.
  const locations = await selectActiveLocationsForChannels(channelIds);

  locations.forEach((location) => {
    if (!cidVsLiveLocations[location.channelCid]) {
      cidVsLiveLocations[location.channelCid] = [];
    }
    cidVsLiveLocations[location.channelCid].push(mapStorableToSharedLocation(location));
  });

  return cidVsLiveLocations;
};
