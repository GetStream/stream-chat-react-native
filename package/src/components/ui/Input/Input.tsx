import React, { useCallback, useMemo, useState } from 'react';

import {
  BlurEvent,
  FocusEvent,
  I18nManager,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../../contexts';
import { Checkmark } from '../../../icons/checkmark-1';
import { InfoTooltip } from '../../../icons/info';
import { primitives } from '../../../theme';
import { IconRenderer } from '../Button';

const inputAccessibilityStates = {
  disabled: { disabled: true, selected: false },
  disabledSelected: { disabled: true, selected: true },
  enabled: { disabled: false, selected: false },
  selected: { disabled: false, selected: true },
} as const;

const getInputAccessibilityState = ({
  disabled,
  selected,
}: {
  disabled: boolean;
  selected: boolean;
}) => {
  if (disabled)
    return selected ? inputAccessibilityStates.disabledSelected : inputAccessibilityStates.disabled;
  return selected ? inputAccessibilityStates.selected : inputAccessibilityStates.enabled;
};

export type InputProps = TextInputProps & {
  title?: string;
  description?: string;
  variant: 'outline' | 'ghost';
  LeadingIcon?: IconRenderer;
  TrailingIcon?: IconRenderer;
  state?: 'default' | 'error' | 'success';
  helperText?: boolean;
  errorMessage?: string;
  successMessage?: string;
  infoText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  {
    title,
    description,
    variant = 'outline',
    LeadingIcon,
    TrailingIcon,
    editable = true,
    state = 'default',
    helperText = true,
    errorMessage,
    successMessage,
    infoText,
    onFocus,
    onBlur,
    containerStyle,
    ...props
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const isRTL = I18nManager.isRTL;

  const LeftIcon = isRTL ? TrailingIcon : LeadingIcon;
  const RightIcon = isRTL ? LeadingIcon : TrailingIcon;
  const accessibilityState = getInputAccessibilityState({
    disabled: !editable,
    selected: isFocused,
  });

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: BlurEvent) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          {
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: !editable
              ? semantics.borderUtilityDisabled
              : isFocused
                ? semantics.borderUtilityActive
                : semantics.borderCoreDefault,
          },
          containerStyle,
        ]}
      >
        {LeftIcon ? (
          <LeftIcon
            height={20}
            width={20}
            strokeWidth={1.5}
            stroke={!editable ? semantics.textDisabled : semantics.textOnAccent}
          />
        ) : null}
        <TextInput
          ref={ref}
          accessibilityHint={description}
          accessibilityLabel={props.accessibilityLabel ?? title}
          accessibilityState={accessibilityState}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.textInput, props.style]}
          placeholderTextColor={semantics.inputTextPlaceholder}
          {...props}
        />
        {state === 'error' && errorMessage ? (
          <View
            accessibilityLiveRegion='assertive'
            accessibilityRole='alert'
            style={{ width: 0, height: 0 }}
          >
            <Text>{errorMessage}</Text>
          </View>
        ) : null}
        {RightIcon ? (
          <RightIcon
            height={20}
            width={20}
            strokeWidth={1.5}
            stroke={!editable ? semantics.textDisabled : semantics.textOnAccent}
          />
        ) : null}
      </View>
      {helperText ? (
        <View style={styles.helperContainer}>
          {state === 'success' ? (
            <Checkmark height={20} width={20} stroke={semantics.accentSuccess} />
          ) : (
            <InfoTooltip
              height={20}
              width={20}
              fill={state === 'error' ? semantics.accentError : semantics.textTertiary}
            />
          )}
          <Text
            style={[
              styles.helperText,
              {
                color:
                  state === 'error'
                    ? semantics.accentError
                    : state === 'success'
                      ? semantics.accentSuccess
                      : semantics.textTertiary,
              },
            ]}
          >
            {state === 'error' ? errorMessage : state === 'success' ? successMessage : infoText}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        gap: primitives.spacingXs,
      },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'left',
      },
      description: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'left',
      },
      inputContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
        paddingHorizontal: primitives.spacingMd,
        paddingVertical: primitives.spacingSm,
        borderRadius: primitives.radiusLg,
        borderColor: semantics.borderCoreDefault,
        minHeight: 48,
      },
      textInput: {
        flex: 1,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightRegular,
        color: semantics.inputTextDefault,
        paddingVertical: 0, // android is adding extra padding so we remove it
        textAlign: I18nManager.isRTL ? 'right' : 'left',
      },
      helperContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
      },
      helperText: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'left',
      },
    });
  }, [semantics]);
};
