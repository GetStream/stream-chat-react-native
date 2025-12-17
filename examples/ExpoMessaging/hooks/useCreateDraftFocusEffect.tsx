import { useCallback } from 'react';
import { useMessageComposer } from 'stream-chat-expo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export const useCreateDraftFocusEffect = () => {
  const navigation = useNavigation();
  const messageComposer = useMessageComposer();

  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('beforeRemove', async () => {
        await messageComposer.createDraft();
      });
    }, [navigation, messageComposer]),
  );
};
