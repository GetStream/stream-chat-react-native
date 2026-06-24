import React from 'react';

import type { UserSearchSource } from 'stream-chat';

import { ChannelAddMembersProvider } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { NotificationList } from '../../../Notifications/NotificationList';

export type ChannelAddMembersFormProps = {
  /** Called when the form is dismissed via the close button or after members are added. */
  onClose: () => void;
  /**
   * A custom `UserSearchSource` used to query and paginate the users to add.
   * Overrides the source the provider creates by default (pre-configured to
   * autocomplete by `name`).
   */
  searchSource?: UserSearchSource;
};

/**
 * Renders the add-members form: a header with a confirm action, the user search
 * list, and the notification list. Mount it wherever the add-members UI should
 * appear (e.g. inside a modal or a navigation screen).
 *
 * @experimental This component is experimental and is subject to change.
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
