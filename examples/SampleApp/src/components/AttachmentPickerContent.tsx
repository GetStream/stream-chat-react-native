import React, { useState } from 'react';
import {
  useAttachmentPickerState,
  AttachmentPickerContentProps,
  AttachmentPickerContent,
  AttachmentPickerGenericContent,
  useStableCallback,
  useTranslationContext,
} from 'stream-chat-react-native';
import { ShareLocationIcon } from '../icons/ShareLocationIcon.tsx';
import { LiveLocationCreateModal } from './LocationSharing/CreateLocationModal.tsx';

export const CustomAttachmentPickerContent = (props: AttachmentPickerContentProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { selectedPicker } = useAttachmentPickerState();
  const { t } = useTranslationContext();

  const onRequestClose = () => {
    setModalVisible(false);
  };

  const onOpenModal = useStableCallback(() => {
    setModalVisible(true);
  });

  if (selectedPicker === 'location') {
    return (
      <>
        <AttachmentPickerGenericContent
          Icon={ShareLocationIcon}
          onPress={onOpenModal}
          height={props.height}
          buttonText={t('Share Location')}
          description={t('Share your location with everyone')}
        />
        {modalVisible ? (
          <LiveLocationCreateModal visible={modalVisible} onRequestClose={onRequestClose} />
        ) : null}
      </>
    );
  }

  return <AttachmentPickerContent {...props} />;
};
