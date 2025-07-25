import { SharedLocationResponse } from 'stream-chat';

import { selectActiveLocationsForChannels } from './queries/selectActiveLocationsForChannels';

import { mapStorableToSharedLocation } from '../mappers/mapStorableToSharedLocation';

export const getChannelActiveLocations = async ({
  channelIds,
}: {
  channelIds: string[];
}): Promise<Record<string, SharedLocationResponse[]>> => {
  const cidVsLiveLocations: Record<string, SharedLocationResponse[]> = {};

  // Query to select active live locations for the given channel ids where the end_at is not empty and it is greater than the current date.
  const locations = await selectActiveLocationsForChannels(channelIds);

  locations.forEach((location) => {
    if (!cidVsLiveLocations[location.channelCid]) {
      cidVsLiveLocations[location.channelCid] = [];
    }
    cidVsLiveLocations[location.channelCid].push(mapStorableToSharedLocation(location));
  });

  return cidVsLiveLocations;
};
