import { useEffect, useRef } from 'react';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

type Parameters = {
  refreshList: () => void;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useConnectionRecovered = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  refreshList,
  setForceUpdate,
}: Parameters) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const refRefreshList = useRef(refreshList);
  refRefreshList.current = refreshList;

  useEffect(() => {
    const handleEvent = () => {
      refRefreshList.current();
      setForceUpdate((count) => count + 1);
    };

    const { unsubscribe: unsubscribeRecovered } = client.on('connection.recovered', handleEvent);
    const { unsubscribe: unsubscribeChanged } = client.on('connection.changed', (event) => {
      if (event.online) {
        handleEvent();
      }
    });

    return () => {
      unsubscribeRecovered();
      unsubscribeChanged();
    };
  }, []);
};
