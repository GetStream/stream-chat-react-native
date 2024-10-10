import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [dialogInput, setDialogInput] = useState('');

  return (
    <Modal animationType='fade' onRequestClose={closeDialog} transparent={true} visible={visible}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            paddingBottom: 20,
            paddingHorizontal: 16,
            paddingTop: 32,
            width: '80%',
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 20 }}>{title}</Text>
          <TextInput
            onChangeText={setDialogInput}
            placeholder='Ask a question'
            style={{
              alignItems: 'center',
              borderColor: 'gray',
              borderRadius: 18,
              borderWidth: 1,
              fontSize: 16,
              height: 36,
              marginTop: 16,
              padding: 0,
              paddingHorizontal: 16,
            }}
            value={dialogInput}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 52 }}>
            <TouchableOpacity onPress={closeDialog}>
              <Text style={{ color: '#005DFF', fontSize: 17, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSubmit(dialogInput);
                closeDialog();
              }}
              style={{ marginLeft: 32 }}
            >
              <Text style={{ color: '#005DFF', fontSize: 17, fontWeight: '500' }}>SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
