import React, { useMemo } from 'react';
import { I18nManager, StyleProp, StyleSheet, ViewStyle, Text, View } from 'react-native';

import { Pressable, PressableProps } from 'react-native-gesture-handler';

import { buttonPadding, buttonSizes } from './constants';
import { useButtonStyles } from './hooks/useButtonStyles';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

export type IconRenderer = (props: IconProps) => React.ReactNode;

const buttonAccessibilityStates = {
  disabled: { disabled: true, selected: false },
  disabledSelected: { disabled: true, selected: true },
  enabled: { disabled: false, selected: false },
  selected: { disabled: false, selected: true },
} as const;

const getButtonAccessibilityState = ({
  disabled,
  selected,
}: {
  disabled: boolean;
  selected: boolean;
}) => {
  if (disabled)
    return selected
      ? buttonAccessibilityStates.disabledSelected
      : buttonAccessibilityStates.disabled;
  return selected ? buttonAccessibilityStates.selected : buttonAccessibilityStates.enabled;
};

export type ButtonProps = PressableProps & {
  /**
   * Translation key used for the button's accessibility label when SDK
   * accessibility is enabled. Prefer this for SDK-owned icon-only buttons.
   */
  accessibilityLabelKey?: string;
  /**
   * Optional interpolation params for `accessibilityLabelKey`.
   */
  accessibilityLabelParams?: Record<string, unknown>;
  /**
   * Ref attached to the native pressable element. Used for accessibility focus restoration.
   */
  pressableRef?: React.Ref<unknown>;
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
  LeadingIcon?: IconRenderer;
  /**
   * The content to display on the center of the button.
   */
  label?: React.ReactNode;
  /**
   * The icon to display on the trailing side of the button.
   */
  TrailingIcon?: IconRenderer;
  /**
   * Whether the button is only an icon.
   */
  iconOnly?: boolean;

  /**
   * The style of the button.
   */
  style?: StyleProp<ViewStyle>;
};

export const Button = ({
  accessibilityLabel,
  accessibilityLabelKey,
  accessibilityLabelParams,
  variant,
  type,
  selected = false,
  size = 'md',
  LeadingIcon,
  TrailingIcon,
  iconOnly = false,
  label,
  onLayout,
  pressableRef,
  disabled = false,
  style,
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
  const IconOnlyIcon = LeadingIcon ?? TrailingIcon;
  const PrimaryIcon = iconOnly ? IconOnlyIcon : LeftIcon;
  const accessibilityState = getButtonAccessibilityState({ disabled: !!disabled, selected });
  const translatedAccessibilityLabel = useA11yLabel(
    accessibilityLabelKey ?? '',
    accessibilityLabelParams,
  );
  const resolvedAccessibilityLabel = translatedAccessibilityLabel ?? accessibilityLabel;

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
          width: iconOnly ? buttonSizes[size].width : '100%',
        },
        style,
      ]}
      onLayout={onLayout}
    >
      <Pressable
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole='button'
        accessibilityState={accessibilityState}
        ref={pressableRef as React.Ref<React.ElementRef<typeof Pressable>>}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? semantics.backgroundUtilityPressed
              : selected
                ? semantics.backgroundUtilitySelected
                : 'transparent',
            paddingHorizontal: iconOnly ? 0 : buttonPadding[size],
          },
          styles.container,
        ]}
        disabled={disabled}
        {...rest}
      >
        {PrimaryIcon ? (
          <PrimaryIcon
            height={20}
            width={20}
            strokeWidth={1.5}
            stroke={disabled ? buttonStyles.disabledForegroundColor : buttonStyles.foregroundColor}
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
