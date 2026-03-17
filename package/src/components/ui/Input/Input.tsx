import React, { useCallback, useMemo, useState } from 'react';

import {
  I18nManager,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEvent,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../../contexts';
import { Checkmark } from '../../../icons/Checkmark';
import { InfoTooltip } from '../../../icons/InfoTooltip';
import { primitives } from '../../../theme';
import { IconRenderer } from '../Button';

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

export const Input = ({
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
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const isRTL = I18nManager.isRTL;

  const LeftIcon = isRTL ? TrailingIcon : LeadingIcon;
  const RightIcon = isRTL ? LeadingIcon : TrailingIcon;

  const handleFocus = useCallback(
    (e: TextInputFocusEvent) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: TextInputFocusEvent) => {
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
              : // TODO: V9: This should go away as it's the same style. In a separate PR though.
                isFocused
                ? semantics.borderCoreDefault
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
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.textInput, props.style]}
          placeholderTextColor={semantics.inputTextPlaceholder}
          {...props}
        />
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
};

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
      },
      description: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
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
      },
    });
  }, [semantics]);
};
