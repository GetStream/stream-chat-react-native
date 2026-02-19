import React, { useCallback } from 'react';

import { useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { Input } from '../../ui/Input/Input';

export const NameField = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { handleFieldBlur, updateFields } = pollComposer;

  const onChangeText = useCallback(
    async (newText: string) => {
      await updateFields({ name: newText });
    },
    [updateFields],
  );

  const onBlur = useCallback(async () => {
    await handleFieldBlur('name');
  }, [handleFieldBlur]);

  return (
    <Input
      title={t('Questions')}
      placeholder={t('Ask a question')}
      variant='outline'
      onChangeText={onChangeText}
      onBlur={onBlur}
      helperText={false}
    />
  );
};
