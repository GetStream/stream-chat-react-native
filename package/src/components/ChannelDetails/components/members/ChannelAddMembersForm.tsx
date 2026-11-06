import React from 'react';

import type { UserSearchSource } from 'stream-chat';

import { ChannelAddMembersProvider } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { NotificationList } from '../../../Notifications/NotificationList';

export type ChannelAddMembersFormProps = {
  /** Called when the form is dismissed with the close button or after members are added. */
  onClose: () => void;
  /** Overrides the default `UserSearchSource`, which autocompletes users by `name`. */
  searchSource?: UserSearchSource;
};

/**
 * The add-members form: a header with a confirm action, the user search list and the notification
 * list. Mount it wherever the add-members UI should appear, such as a modal or a screen.
 */
export const ChannelAddMembersForm = ({ onClose, searchSource }: ChannelAddMembersFormProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelAddMembersFormContent, ChannelAddMembersFormHeader } = useComponentsContext();

  if (!channel?.cid) {
    return null;
  }

  return (
    <ChannelAddMembersProvider searchSource={searchSource}>
      <ChannelAddMembersFormHeader onClose={onClose} />
      <ChannelAddMembersFormContent />
      <NotificationList />
    </ChannelAddMembersProvider>
  );
};
