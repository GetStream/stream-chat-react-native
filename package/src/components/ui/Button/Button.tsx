import React, { useMemo } from 'react';
import { I18nManager, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { buttonPadding, buttonSizes } from './constants';
import { useButtonStyles } from './hooks/useButtonStyles';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

export type ButtonProps = PressableProps & {
  /**
   * The style of the button.
   */
  variant: 'primary' | 'secondary' | 'destructive';
  /**
   * The type of the button.
   */
  type: 'solid' | 'outline' | 'ghost' | 'liquidGlass';
  /**
   * The size of the button.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the button is selected.
   */
  selected?: boolean;
  /**
   * The icon to display on the leading side of the button.
   */
  LeadingIcon?: React.FC<IconProps>;
  /**
   * The content to display on the center of the button.
   */
  label?: React.ReactNode;
  /**
   * The icon to display on the trailing side of the button.
   */
  TrailingIcon?: React.FC<IconProps>;
  /**
   * Whether the button is only an icon.
   */
  iconOnly?: boolean;
  /**
   * The props to pass to the trailing icon.
   */
  trailingIconProps?: IconProps;
  /**
   * The props to pass to the leading icon.
   */
  leadingIconProps?: IconProps;
};

export const Button = ({
  variant,
  type,
  selected = false,
  size = 'md',
  LeadingIcon,
  TrailingIcon,
  iconOnly = false,
  label,
  leadingIconProps,
  trailingIconProps,
  onLayout,
  disabled = false,
  ...rest
}: ButtonProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const buttonStyles = useButtonStyles({ variant, type });
  const styles = useStyles();

  const isRTL = I18nManager.isRTL;

  const LeftIcon = isRTL ? TrailingIcon : LeadingIcon;
  const RightIcon = isRTL ? LeadingIcon : TrailingIcon;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: disabled
            ? buttonStyles.disabledBackgroundColor
            : buttonStyles.backgroundColor,
          borderWidth: buttonStyles.borderColor ? 1 : undefined,
          borderColor: disabled ? buttonStyles.disabledBorderColor : buttonStyles.borderColor,
          height: buttonSizes[size].height,
          width: iconOnly ? buttonSizes[size].width : undefined,
        },
      ]}
      onLayout={onLayout}
    >
      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? semantics.backgroundCorePressed
              : selected
                ? semantics.backgroundCoreSelected
                : 'transparent',
          },
          styles.container,
          { paddingHorizontal: buttonPadding[size] },
        ]}
        {...rest}
      >
        {LeftIcon ? (
          <LeftIcon
            height={20}
            width={20}
            strokeWidth={1.5}
            stroke={disabled ? buttonStyles.disabledForegroundColor : buttonStyles.foregroundColor}
            {...leadingIconProps}
          />
        ) : null}
        {!iconOnly ? (
          <>
            {typeof label === 'string' ? (
              <Text
                style={[
                  styles.label,
                  {
                    color: disabled
                      ? buttonStyles.disabledForegroundColor
                      : buttonStyles.foregroundColor,
                  },
                ]}
              >
                {label}
              </Text>
            ) : (
              label
            )}
            {RightIcon ? (
              <RightIcon
                height={20}
                width={20}
                strokeWidth={1.5}
                stroke={
                  disabled ? buttonStyles.disabledForegroundColor : buttonStyles.foregroundColor
                }
                {...trailingIconProps}
              />
            ) : null}
          </>
        ) : null}
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          borderRadius: primitives.radiusMax,
        },
        container: {
          borderRadius: primitives.radiusMax,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: primitives.spacingXs,
        },
        label: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [],
  );
};
