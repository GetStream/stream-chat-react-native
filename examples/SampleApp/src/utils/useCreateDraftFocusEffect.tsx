import { useCallback } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMessageComposer } from 'stream-chat-react-native';

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
