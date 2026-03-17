import { useMemo } from 'react';
import { ColorValue } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ButtonProps } from '../Button';

export type ButtonStyleCategory =
  | 'primarySolid'
  | 'primaryOutline'
  | 'primaryGhost'
  | 'secondarySolid'
  | 'secondaryOutline'
  | 'secondaryGhost'
  | 'destructiveSolid'
  | 'destructiveOutline'
  | 'destructiveGhost';

export type ButtonStyle = {
  foregroundColor?: ColorValue;
  backgroundColor?: ColorValue;
  borderColor?: ColorValue;
  disabledForegroundColor?: ColorValue;
  disabledBackgroundColor?: ColorValue;
  disabledBorderColor?: ColorValue;
};

export type ButtonStylesConfig = Pick<ButtonProps, 'variant' | 'type'>;

/**
 * Returns the styles for the button based on the button style and type.
 * @param buttonStyle - The style of the button.
 * @param type - The type of the button.
 * @returns The styles for the button.
 */
export const useButtonStyles = ({ variant, type }: ButtonStylesConfig) => {
  const {
    theme: { semantics },
  } = useTheme();

  const category = variant.concat(type[0].toUpperCase() + type.slice(1)) as ButtonStyleCategory;

  const defaultButtonStyles: Record<ButtonStyleCategory, ButtonStyle> = useMemo(() => {
    return {
      primarySolid: {
        foregroundColor: semantics.buttonPrimaryTextOnAccent,
        backgroundColor: semantics.buttonPrimaryBg,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: semantics.backgroundUtilityDisabled,
        disabledBorderColor: undefined,
      },
      primaryOutline: {
        foregroundColor: semantics.buttonPrimaryText,
        backgroundColor: undefined,
        borderColor: semantics.buttonPrimaryBorder,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: semantics.borderUtilityDisabled,
      },
      primaryGhost: {
        foregroundColor: semantics.buttonPrimaryText,
        backgroundColor: undefined,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: undefined,
      },
      secondarySolid: {
        foregroundColor: semantics.buttonSecondaryTextOnAccent,
        backgroundColor: semantics.buttonSecondaryBg,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: semantics.backgroundUtilityDisabled,
        disabledBorderColor: undefined,
      },
      secondaryOutline: {
        foregroundColor: semantics.buttonSecondaryText,
        backgroundColor: undefined,
        borderColor: semantics.buttonSecondaryBorder,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: semantics.buttonSecondaryBorder,
      },
      secondaryGhost: {
        foregroundColor: semantics.buttonSecondaryText,
        backgroundColor: undefined,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: undefined,
      },
      destructiveSolid: {
        foregroundColor: semantics.buttonDestructiveTextOnAccent,
        backgroundColor: semantics.buttonDestructiveBg,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: semantics.backgroundUtilityDisabled,
        disabledBorderColor: undefined,
      },
      destructiveOutline: {
        foregroundColor: semantics.buttonDestructiveText,
        backgroundColor: undefined,
        borderColor: semantics.buttonDestructiveBorder,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: semantics.borderUtilityDisabled,
      },
      destructiveGhost: {
        foregroundColor: semantics.buttonDestructiveText,
        backgroundColor: undefined,
        borderColor: undefined,
        disabledForegroundColor: semantics.textDisabled,
        disabledBackgroundColor: undefined,
        disabledBorderColor: undefined,
      },
    };
  }, [semantics]);

  return defaultButtonStyles[category];
};
