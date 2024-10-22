import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme, useTranslationContext } from '../../../contexts';

export type PollInputDialogProps = {
  closeDialog: () => void;
  onSubmit: (text: string) => void;
  title: string;
  visible: boolean;
};

export const PollInputDialog = ({
  closeDialog,
  onSubmit,
  title,
  visible,
}: PollInputDialogProps) => {
  const { t } = useTranslationContext();
  const [dialogInput, setDialogInput] = useState('');

  const {
    theme: {
      colors: { accent_dark_blue },
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
      <View style={[styles.transparentContainer, transparentContainer]}>
        <View style={[styles.container, container]}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          <TextInput
            onChangeText={setDialogInput}
            placeholder={t<string>('Ask a question')}
            style={[styles.input, input]}
            value={dialogInput}
          />
          <View style={[styles.buttonContainer, buttonContainer]}>
            <TouchableOpacity onPress={closeDialog}>
              <Text style={[styles.button, { color: accent_dark_blue }, button]}>
                {t<string>('Cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSubmit(dialogInput);
                closeDialog();
              }}
              style={{ marginLeft: 32 }}
            >
              <Text style={[styles.button, { color: accent_dark_blue }, button]}>
                {t<string>('SEND')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: { fontSize: 17, fontWeight: '500' },
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flex: 1,
    justifyContent: 'center',
  },
});
