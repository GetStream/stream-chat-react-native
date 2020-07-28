import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { ChatContext } from '../../context';
import useLatestMessagePreview from './hooks/useLatestMessagePreview';

const ChannelPreviewWithContext = React.memo((props) => {
  const { channel, client } = props;
  const [lastMessage, setLastMessage] = useState({});
  const [unread, setUnread] = useState(channel.countUnread());
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
});

const ChannelPreview = (props) => {
  const { client } = useContext(ChatContext);
  return <ChannelPreviewWithContext {...props} {...{ client }} />;
};

ChannelPreview.propTypes = {
  channel: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  setActiveChannel: PropTypes.func,
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default ChannelPreview;
