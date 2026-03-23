import type { File } from '../../../../types/types';

export const IOS_LIMITED_DEEPLINK = '@getstream/ios-limited-button' as const;

export type IosLimitedItemType = { uri: typeof IOS_LIMITED_DEEPLINK };

export type PhotoContentItemType = File | IosLimitedItemType;

export const isIosLimited = (item: PhotoContentItemType): item is IosLimitedItemType =>
  'uri' in item && item.uri === IOS_LIMITED_DEEPLINK;
