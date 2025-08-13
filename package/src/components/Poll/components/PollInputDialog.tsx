import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme, useTranslationContext } from '../../../contexts';

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
      colors: { accent_dark_blue, black, white },
      poll: {
        inputDialog: {
          button,
          buttonContainer,
          container,
          input,
          title: titleStyle,
          transparentContainer,
        },
      },
    },
  } = useTheme();

  return (
    <Modal animationType='fade' onRequestClose={closeDialog} transparent={true} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.transparentContainer, transparentContainer]}
      >
        <View style={[styles.container, { backgroundColor: white }, container]}>
          <Text style={[styles.title, { color: black }, titleStyle]}>{title}</Text>
          <TextInput
            autoFocus={true}
            onChangeText={setDialogInput}
            placeholder={t('Ask a question')}
            style={[styles.input, { color: black }, input]}
            value={dialogInput}
          />
          <View style={[styles.buttonContainer, buttonContainer]}>
            <Pressable
              onPress={closeDialog}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Text style={[styles.button, { color: accent_dark_blue }, button]}>
                {t('Cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSubmit(dialogInput);
                closeDialog();
              }}
              style={({ pressed }) => ({ marginLeft: 32, opacity: pressed ? 0.5 : 1 })}
            >
              <Text style={[styles.button, { color: accent_dark_blue }, button]}>{t('SEND')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: { fontSize: 16, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 52 },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 32,
    width: '80%',
  },
  input: {
    alignItems: 'center',
    borderColor: 'gray',
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 16,
    height: 36,
    marginTop: 16,
    padding: 0,
    paddingHorizontal: 16,
  },
  title: { fontSize: 17, fontWeight: '500', lineHeight: 20 },
  transparentContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
    justifyContent: 'center',
  },
});
