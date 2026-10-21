import React from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChannelEditDetailsProvider } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import type { GlobalFileUploadRequest } from '../../../types/types';
import { NotificationList } from '../../Notifications/NotificationList';

export type ChannelEditDetailsFormProps = {
  /** Called when the form is dismissed with the close button or after a successful save. */
  onClose: () => void;
  /** Compression quality, from 0 to 1 (best), applied to the channel image picked while editing. */
  compressImageQuality?: number;
  /** Overrides the request that uploads the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
};

/**
 * The channel edit form: a header with a confirm action, the editable fields and the notification
 * list. Mount it wherever the edit UI should appear, such as a modal or a screen.
 */
export const ChannelEditDetailsForm = ({
  compressImageQuality,
  doFileUploadRequest,
  onClose,
}: ChannelEditDetailsFormProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelEditDetailsFormContent, ChannelEditDetailsFormHeader } = useComponentsContext();

  if (!channel?.cid) {
    return null;
  }

  return (
    <ChannelEditDetailsProvider
      compressImageQuality={compressImageQuality}
      doFileUploadRequest={doFileUploadRequest}
    >
      <ChannelEditDetailsFormHeader onClose={onClose} />
      <ChannelEditDetailsFormContent />
      <NotificationList />
    </ChannelEditDetailsProvider>
  );
};
