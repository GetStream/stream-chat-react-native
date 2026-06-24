import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel, MessageSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelFileAttachmentListContextValue = {
  channel: Channel;
  searchSource: MessageSearchSource;
};

export const ChannelFileAttachmentListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelFileAttachmentListContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelFileAttachmentListProvider = ({
  channel,
  children,
  searchSource: searchSourceProp,
}: PropsWithChildren<{ channel: Channel; searchSource?: MessageSearchSource }>) => {
  const { client } = useChatContext();
  const [defaultSearchSource] = useState(() => {
    const source = new MessageSearchSource(client, {
      allowEmptySearchString: true,
      pageSize: 25,
      resetOnNewSearchQuery: false,
    });
    source.messageSearchChannelFilters = { cid: channel.cid, members: undefined };
    source.messageSearchFilters = {
      $or: [{ 'attachments.type': 'file' }, { 'attachments.type': 'audio' }],
    };
    // Newest first so the list groups cleanly under month section headers.
    source.messageSearchSort = { created_at: -1 };
    source.activate();
    return source;
  });
  const searchSource = searchSourceProp ?? defaultSearchSource;

  return (
    <ChannelFileAttachmentListContext.Provider value={{ channel, searchSource }}>
      {children}
    </ChannelFileAttachmentListContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelFileAttachmentListContext = () => {
  const contextValue = useContext(
    ChannelFileAttachmentListContext,
  ) as unknown as ChannelFileAttachmentListContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelFileAttachmentListContext hook was called outside of the ChannelFileAttachmentListContext provider. Render the file attachment list UI inside a ChannelFileAttachmentListProvider.',
    );
  }

  return contextValue;
};
