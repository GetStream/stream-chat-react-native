import React, { PureComponent } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { withChannelContext } from '../context';
import { logChatPromiseExecution } from 'stream-chat';
import { buildStylesheet } from '../styles';

class MessageInput extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }

  static propTypes = {};

  sendMessage = async () => {
    if (!this.state.text) return;

    try {
      this.props.sendMessage({ text: this.state.text });
      this.setState({ text: '' });
    } catch (err) {
      console.log('Fialed');
    }
  };

  handleChange = (text) => {
    this.setState({ text });
    if (text) {
      logChatPromiseExecution(
        this.props.channel.keystroke(),
        'start typing event',
      );
    }
  };

  // https://stackoverflow.com/a/29234240/7625485
  constructTypingString = (dict) => {
    const arr2 = Object.keys(dict);
    const arr3 = [];
    arr2.forEach((item, i) =>
      arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id),
    );
    let outStr = '';
    if (arr3.length === 1) {
      outStr = arr3[0] + ' is typing...';
      dict;
    } else if (arr3.length === 2) {
      //joins all with "and" but =no commas
      //example: "bob and sam"
      outStr = arr3.join(' and ') + ' are typing...';
    } else if (arr3.length > 2) {
      //joins all with commas, but last one gets ", and" (oxford comma!)
      //example: "bob, joe, and sam"
      outStr =
        arr3.slice(0, -1).join(', ') +
        ', and ' +
        arr3.slice(-1) +
        ' are typing...';
    }

    return outStr;
  };

  render() {
    const styles = buildStylesheet('messageInput', this.props.styles);

    return (
      <React.Fragment>
        <View style={styles.container}>
          <TextInput
            style={styles.inputBox}
            placeholder="Write your message"
            onChangeText={this.handleChange}
            value={this.state.text}
          />
          <TouchableOpacity
            title="Pick an image from camera roll"
            onPress={this.sendMessage}
          >
            <Image source={require('../images/icons/send.png')} />
          </TouchableOpacity>
        </View>
        <Text style={{ textAlign: 'right', height: 20 }}>
          {this.props.channel.state.typing
            ? this.constructTypingString(this.props.channel.state.typing)
            : ''}
        </Text>
      </React.Fragment>
    );
  }
}

MessageInput = withChannelContext(MessageInput);
export { MessageInput };
