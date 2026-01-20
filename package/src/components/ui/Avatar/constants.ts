import { UserAvatarProps } from './UserAvatar';

import { FontWeightType } from '../../../theme/primitives/typography';
import { OnlineIndicatorProps } from '../OnlineIndicator';

const indicatorSizes: Record<UserAvatarProps['size'], OnlineIndicatorProps['size']> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

const iconSizes: Record<UserAvatarProps['size'], number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
};

const fontSizes: Record<
  UserAvatarProps['size'],
  { fontSize: number; lineHeight: number; fontWeight: FontWeightType }
> = {
  xs: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  sm: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  md: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  lg: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
};

const numberOfInitials: Record<UserAvatarProps['size'], number> = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 2,
};

export { indicatorSizes, iconSizes, fontSizes, numberOfInitials };
