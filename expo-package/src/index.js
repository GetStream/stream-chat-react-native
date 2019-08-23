import { registerNativeHandlers } from 'stream-chat-react-native-core';
import { NetInfo } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import * as DocumentPicker from 'expo-document-picker';

registerNativeHandlers({
  NetInfo,
  pickImage: async () => {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);

    return await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      aspect: [4, 3],
      //TODO: Decide what to do about it
      quality: 0.2,
    });
  },
  pickDocument: async () => await DocumentPicker.getDocumentAsync(),
});

export * from 'stream-chat-react-native-core';
