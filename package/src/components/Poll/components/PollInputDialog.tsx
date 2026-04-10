import React, { useMemo, useState } from 'react';
import {
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Animated, { LinearTransition, ZoomIn } from 'react-native-reanimated';

import { useTheme, useTranslationContext } from '../../../contexts';
import { primitives } from '../../../theme';
import { Button } from '../../ui';

export type PollInputDialogProps = {
  closeDialog: () => void;
  onSubmit: (text: string) => void;
  placeholder: string;
  title: string;
  visible: boolean;
  initialValue?: string;
};

export const PollInputDialog = ({
  closeDialog,
  initialValue = '',
  onSubmit,
  placeholder,
  title,
  visible,
}: PollInputDialogProps) => {
  const { t } = useTranslationContext();
  const [dialogInput, setDialogInput] = useState(initialValue);

  const {
    theme: {
      semantics,
      poll: {
        inputDialog: { buttonContainer, container, input, title: titleStyle, transparentContainer },
      },
    },
  } = useTheme();

  const styles = useStyles();

  return (
    <Modal animationType='fade' onRequestClose={closeDialog} transparent={true} visible={visible}>
      <GestureHandlerRootView style={styles.modalRoot}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.transparentContainer, transparentContainer]}
        >
          <Animated.View
            entering={ZoomIn.duration(200)}
            layout={LinearTransition.duration(200)}
            style={[styles.container, container]}
          >
            <View style={styles.inputContainer}>
              <Text style={[styles.title, titleStyle]}>{title}</Text>
              <TextInput
                autoFocus={true}
                onChangeText={setDialogInput}
                placeholder={placeholder}
                placeholderTextColor={semantics.inputTextPlaceholder}
                style={[styles.input, input]}
                value={dialogInput}
              />
            </View>
            <View style={[styles.buttonContainer, buttonContainer]}>
              <Button
                variant={'secondary'}
                type={'ghost'}
                label={t('Cancel')}
                size='md'
                onPress={closeDialog}
                style={styles.button}
              />
              <Button
                variant={'primary'}
                type={'solid'}
                label={t('Send')}
                size='md'
                onPress={() => {
                  onSubmit(dialogInput);
                  closeDialog();
                }}
                style={styles.button}
                disabled={!dialogInput}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      poll: {
        inputDialog: { button },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        button: { flex: 1, width: undefined, ...button },
        buttonContainer: { flexDirection: 'row', gap: primitives.spacingXs },
        container: {
          backgroundColor: semantics.backgroundCoreElevation1,
          borderRadius: primitives.radiusXl,
          paddingBottom: primitives.spacingXl,
          paddingHorizontal: primitives.spacingXl,
          paddingTop: primitives.spacing2xl,
          gap: primitives.spacing2xl,
          width: 304,
        },
        modalRoot: {
          flex: 1,
        },
        inputContainer: {
          gap: primitives.spacingXs,
        },
        input: {
          alignItems: 'center',
          borderColor: semantics.borderUtilityActive,
          borderRadius: primitives.radiusMd,
          borderWidth: 1,
          fontSize: primitives.typographyFontSizeMd,
          padding: primitives.spacingSm,
          color: semantics.textPrimary,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        title: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightMedium,
          lineHeight: primitives.typographyLineHeightNormal,
        },
        transparentContainer: {
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          flex: 1,
          justifyContent: 'center',
        },
      }),
    [button, semantics],
  );
};
