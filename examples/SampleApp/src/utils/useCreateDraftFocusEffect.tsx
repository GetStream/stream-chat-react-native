import { useCallback } from 'react';
import { useMessageComposer } from 'stream-chat-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export const useCreateDraftFocusEffect = () => {
  const navigation = useNavigation();
  const messageComposer = useMessageComposer();

  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('beforeRemove', async () => {
        try {
          await messageComposer.createDraft();
        } catch (e) {
          console.error('Failed to save draft before remove', e);
        }
      });
    }, [navigation, messageComposer]),
  );
};
