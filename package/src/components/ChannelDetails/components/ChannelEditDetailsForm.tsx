import React from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChannelEditDetailsProvider } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import type { GlobalFileUploadRequest } from '../../../types/types';
import { NotificationList } from '../../Notifications/NotificationList';

export type ChannelEditDetailsFormProps = {
  /** Called when the form is dismissed via the close button or after a successful save. */
  onClose: () => void;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality) applied
   * to the channel image picked during editing.
   */
  compressImageQuality?: number;
  /** Override the upload request used to upload the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
};

/**
 * Renders the channel edit details form: a header with a confirm action, the
 * editable fields, and the notification list. Wrap-free — mount it wherever the
 * edit UI should appear (e.g. inside a modal or a navigation screen).
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
