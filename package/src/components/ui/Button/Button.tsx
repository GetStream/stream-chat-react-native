import React, { useMemo } from 'react';
import { I18nManager, StyleProp, StyleSheet, ViewStyle, Text, View } from 'react-native';

import { Pressable, PressableProps } from 'react-native-gesture-handler';

import { buttonPadding, buttonSizes } from './constants';
import { useButtonStyles } from './hooks/useButtonStyles';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useAccessibilityActivateAction } from '../../../a11y/hooks/useAccessibilityActivateAction';
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
  /** Translation key of the accessibility label, resolved only with SDK accessibility enabled. */
  accessibilityLabelKey?: string;
  /** Interpolation params for `accessibilityLabelKey`. */
  accessibilityLabelParams?: Record<string, unknown>;
  /** Color variant of the button. */
  variant: 'primary' | 'secondary' | 'destructive';
  /** Fill style of the button. */
  type: 'solid' | 'outline' | 'ghost' | 'liquidGlass';
  /** Size of the button. Defaults to `'md'`. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is selected. Defaults to false. */
  selected?: boolean;
  /** Icon on the leading side. Swaps with `TrailingIcon` in RTL. */
  LeadingIcon?: IconRenderer;
  /** Content in the center. Strings are wrapped in a styled `Text`. */
  label?: React.ReactNode;
  /** Icon on the trailing side. Swaps with `LeadingIcon` in RTL. */
  TrailingIcon?: IconRenderer;
  /** Renders only an icon (`LeadingIcon`, else `TrailingIcon`). Defaults to false. */
  iconOnly?: boolean;

  /** Style of the button's outer container. */
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
  const accessibilityActivateActionProps = useAccessibilityActivateAction({
    onPress: rest.onPress,
    shouldHandleActivate: !!rest.onPress && !disabled && !!resolvedAccessibilityLabel,
  });

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
        accessible
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole='button'
        accessibilityState={accessibilityState}
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
        {...accessibilityActivateActionProps}
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
