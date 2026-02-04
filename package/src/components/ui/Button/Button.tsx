import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { buttonPadding, buttonSizes } from './constants';
import { useButtonStyles } from './hooks/useButtonStyles';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';
import { BadgeNotification } from '../BadgeNotification';

export type ButtonProps = PressableProps & {
  /**
   * The style of the button.
   */
  buttonStyle: 'primary' | 'secondary' | 'destructive';
  /**
   * The type of the button.
   */
  type: 'solid' | 'outline' | 'ghost' | 'liquidGlass';
  /**
   * The size of the button.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The state in which the button is.
   */
  state?: 'default' | 'disabled' | 'pressed' | 'selected';
  /**
   * The icon to display on the leading side of the button.
   */
  LeadingIcon?: React.FC<IconProps>;
  /**
   * The icon to display on the trailing side of the button.
   */
  TrailingIcon?: React.FC<IconProps>;
  /**
   * Whether the button is only an icon.
   */
  iconOnly?: boolean;
  /**
   * The label to display on the button.
   */
  label?: string;
  /**
   * Whether the button has a badge.
   */
  badge?: boolean;
  /**
   * The count to display on the badge.
   */
  badgeCount?: number;
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
  buttonStyle,
  type,
  state = 'default',
  size = 'md',
  LeadingIcon,
  TrailingIcon,
  iconOnly = false,
  label,
  onLayout,
  disabled = false,
  badge = false,
  badgeCount = 0,
  trailingIconProps,
  leadingIconProps,
  ...rest
}: ButtonProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const buttonStyles = useButtonStyles({ buttonStyle, type });
  const styles = useStyles();

  const buttonStatesColors = {
    default: 'transparent',
    pressed: semantics.backgroundCorePressed,
    selected: semantics.backgroundCoreSelected,
    disabled: 'transparent',
  };

  const isDisabled = disabled || state === 'disabled';

  return (
    <View style={{ padding: badge ? primitives.spacingXxs : undefined }}>
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: isDisabled
              ? buttonStyles.disabledBackgroundColor
              : buttonStyles.backgroundColor,
            borderWidth: buttonStyles.borderColor ? 1 : undefined,
            borderColor: isDisabled ? buttonStyles.disabledBorderColor : buttonStyles.borderColor,
            height: buttonSizes[size].height,
            width: iconOnly ? buttonSizes[size].width : undefined,
          },
        ]}
        onLayout={onLayout}
      >
        <Pressable
          style={({ pressed }) => [
            pressed
              ? { backgroundColor: buttonStatesColors.pressed }
              : { backgroundColor: buttonStatesColors[state] },
            styles.container,
            { paddingHorizontal: buttonPadding[size] },
          ]}
          {...rest}
        >
          {LeadingIcon ? (
            <LeadingIcon
              height={20}
              width={20}
              strokeWidth={1.5}
              stroke={
                isDisabled ? buttonStyles.disabledForegroundColor : buttonStyles.foregroundColor
              }
              {...leadingIconProps}
            />
          ) : null}
          {!iconOnly ? (
            <>
              {label ? (
                <Text
                  style={[
                    styles.label,
                    {
                      color: isDisabled
                        ? buttonStyles.disabledForegroundColor
                        : buttonStyles.foregroundColor,
                    },
                  ]}
                >
                  {label}
                </Text>
              ) : null}
              {TrailingIcon ? (
                <TrailingIcon
                  height={20}
                  width={20}
                  strokeWidth={1.5}
                  stroke={
                    isDisabled ? buttonStyles.disabledForegroundColor : buttonStyles.foregroundColor
                  }
                  {...trailingIconProps}
                />
              ) : null}
            </>
          ) : null}
        </Pressable>
      </View>
      <View style={styles.badgeContainer}>
        {badge && badgeCount > 0 ? (
          <BadgeNotification count={badgeCount} size='md' type='primary' testID='badge' />
        ) : null}
      </View>
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
        badgeContainer: {
          position: 'absolute',
          top: 0,
          right: 0,
        },
      }),
    [],
  );
};
