import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import { ChatContext } from '../../context';
import useLatestMessagePreview from './hooks/useLatestMessagePreview';

const ChannelPreview = (props) => {
  const { client } = useContext(ChatContext);
  const { channel } = props;

  const [unread, setUnread] = useState(channel.countUnread());
  const [lastMessage, setLastMessage] = useState({});
  const latestMessagePreview = useLatestMessagePreview(channel);

  useEffect(() => {
    const handleNewMessageEvent = (e) => {
      setLastMessage(e.message);
      setUnread(channel.countUnread());
    };

    channel.on('message.new', handleNewMessageEvent);

    return () => {
      channel.off('message.new', handleNewMessageEvent);
    };
  });

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
  });

  const { Preview } = props;
  return (
    <Preview
      {...props}
      lastMessage={lastMessage}
      latestMessage={latestMessagePreview}
      unread={unread}
    />
  );
};

ChannelPreview.propTypes = {
  channel: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  setActiveChannel: PropTypes.func,
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default ChannelPreview;
