import React, { useMemo, useState } from 'react';
import {
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
  title: string;
  visible: boolean;
  initialValue?: string;
};

export const PollInputDialog = ({
  closeDialog,
  initialValue = '',
  onSubmit,
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
                placeholder={t('Ask a question')}
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
              {/*<Pressable*/}
              {/*  onPress={closeDialog}*/}
              {/*  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}*/}
              {/*>*/}
              {/*  <Text style={[styles.button, { color: accent_dark_blue }, button]}>*/}
              {/*    {t('Cancel')}*/}
              {/*  </Text>*/}
              {/*</Pressable>*/}
              <Button
                variant={'secondary'}
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
              {/*<Pressable*/}
              {/*  onPress={() => {*/}
              {/*    onSubmit(dialogInput);*/}
              {/*    closeDialog();*/}
              {/*  }}*/}
              {/*  style={({ pressed }) => ({ marginLeft: 32, opacity: pressed ? 0.5 : 1 })}*/}
              {/*>*/}
              {/*  <Text style={[styles.button, { color: accent_dark_blue }, button]}>*/}
              {/*    {t('SEND')}*/}
              {/*  </Text>*/}
              {/*</Pressable>*/}
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
          borderColor: semantics.borderCoreDefault,
          borderRadius: primitives.radiusMd,
          borderWidth: 1,
          fontSize: primitives.typographyFontSizeMd,
          padding: primitives.spacingSm,
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
