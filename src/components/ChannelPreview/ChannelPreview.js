import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { ChatContext } from '../../context';
import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

const ChannelPreview = (props) => {
  const { channel } = props;
  const { client } = useContext(ChatContext);
  const [lastMessage, setLastMessage] = useState({});
  const [unread, setUnread] = useState(channel.countUnread());
  const latestMessage = useLatestMessagePreview(channel, lastMessage);

  useEffect(() => {
    const handleEvent = (e) => {
      setLastMessage(e.message);

      if (e.type === 'message.new') {
        setUnread(channel.countUnread());
      }
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, []);

  useEffect(() => {
    const handleReadEvent = (e) => {
      if (e.user.id === client.userID) {
        setUnread(0);
      }
    };

    channel.on('message.read', handleReadEvent);

    return () => {
      channel.off('message.read', handleReadEvent);
    };
  }, []);

  const { Preview } = props;
  return (
    <Preview
      {...props}
      lastMessage={lastMessage}
      latestMessage={latestMessage}
      unread={unread}
    />
  );
};

ChannelPreview.propTypes = {
  channel: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  setActiveChannel: PropTypes.func,
};

export default React.memo(ChannelPreview);
