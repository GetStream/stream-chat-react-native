import { TextStyle } from 'react-native';

import { UserAvatarProps } from './UserAvatar';

import { primitives } from '../../../theme';
import { OnlineIndicatorProps } from '../Badge';

const avatarSizes = {
  '2xl': {
    height: 64,
    width: 64,
  },
  xl: {
    height: 48,
    width: 48,
  },
  lg: {
    height: 40,
    width: 40,
  },
  md: {
    height: 32,
    width: 32,
  },
  sm: {
    height: 24,
    width: 24,
  },
  xs: {
    height: 20,
    width: 20,
  },
};

const indicatorSizes: Record<UserAvatarProps['size'], OnlineIndicatorProps['size']> = {
  '2xl': 'xl',
  xl: 'xl',
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'sm',
};

const iconSizes: Record<UserAvatarProps['size'], number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

const fontSizes: Record<
  UserAvatarProps['size'],
  {
    fontSize: TextStyle['fontSize'];
    lineHeight: TextStyle['lineHeight'];
    fontWeight: TextStyle['fontWeight'];
  }
> = {
  xs: {
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightTight,
  },
  sm: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  md: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  lg: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  xl: {
    fontSize: primitives.typographyFontSizeLg,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightRelaxed,
  },
  '2xl': {
    fontSize: primitives.typographyFontSizeXl,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightRelaxed,
  },
};

const numberOfInitials: Record<UserAvatarProps['size'], number> = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 2,
  xl: 2,
  '2xl': 2,
};

export { indicatorSizes, iconSizes, fontSizes, numberOfInitials, avatarSizes };
