import React, { useContext } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import { ChatContext, TranslationContext } from '../../context';

import ChannelInner from './ChannelInner';
import { KeyboardCompatibleView } from '../KeyboardCompatibleView';

/**
 * Channel - Wrapper component for a channel. It needs to be place inside of the Chat component.
 * MessageList, Thread and MessageInput should be used as children of the Channel component.
 *
 * @example ../docs/Channel.md
 */
const Channel = (props) => {
  const { client, isOnline, logger } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);

  if (!props.channel?.cid) {
    return (
      <Text style={{ fontWeight: 'bold', padding: 16 }}>
        {t('Please select a channel first')}
      </Text>
    );
  }

  return <ChannelInner {...props} {...{ client, isOnline, logger, t }} />;
};

Channel.propTypes = {
  /** Which channel to connect to */
  channel: PropTypes.shape({
    watch: PropTypes.func,
  }).isRequired,
  /** Client is passed via the Chat Context */
  client: PropTypes.object,
  isOnline: PropTypes.bool,
  /**
   * Loading indicator UI component. This will be shown on the screen until the messages are
   * being queried from channel. Once the messages are loaded, loading indicator is removed from the screen
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Error indicator UI component. This will be shown on the screen if channel query fails.
   *
   * Defaults to and accepts same props as: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   *
   * */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Empty state indicator UI component. This will be shown on the screen if channel has no messages.
   *
   * Defaults to and accepts same props as: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   *
   * */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Message UI component to display a message in message list.
   *
   * Available built-in component (also accepts the same props as): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   *
   * */
  Message: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Attachment UI component to display attachment in individual message.
   *
   * Available built-in component (also accepts the same props as): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
   * */
  Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * If true, KeyboardCompatibleView wrapper is disabled.
   *
   * Channel component internally uses [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js) component
   * internally to adjust the height of Channel component when keyboard is opened or dismissed. This prop gives you ability to disable this functionality, in case if you
   * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or you want to handle keyboard dismissal yourself.
   * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
   * */
  disableKeyboardCompatibleView: PropTypes.bool,
  /**
   * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed.
   * Defaults to [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
   *
   * This prop can be used to configure default KeyboardCompatibleView component.
   * e.g.,
   * <Channel
   *  channel={channel}
   *  ...
   *  KeyboardCompatibleView={(props) => {
   *    return (
   *      <KeyboardCompatibleView keyboardDismissAnimationDuration={200} keyboardOpenAnimationDuration={200}>
   *        {props.children}
   *      </KeyboardCompatibleView>
   *    )
   *  }}
   * />
   */
  KeyboardCompatibleView: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Override mark channel read request (Advanced usage only)
   *
   * @param channel Channel object
   * */
  doMarkReadRequest: PropTypes.func,
  /**
   * Override send message request (Advanced usage only)
   *
   * @param channelId
   * @param messageData Message object
   * */
  doSendMessageRequest: PropTypes.func,
  /**
   * Override update message request (Advanced usage only)
   * @param channelId
   * @param updatedMessage UpdatedMessage object
   * */
  doUpdateMessageRequest: PropTypes.func,
  /** Disables the channel UI if channel is frozen */
  disableIfFrozenChannel: PropTypes.bool,
};

Channel.defaultProps = {
  disableIfFrozenChannel: true,
  disableKeyboardCompatibleView: false,
  KeyboardCompatibleView,
};

export default Channel;
