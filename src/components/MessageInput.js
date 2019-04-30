import React, { PureComponent } from 'react';
import { View, TextInput, Image, TouchableOpacity } from 'react-native';
import { withChannelContext } from '../context';
import { logChatPromiseExecution } from 'stream-chat';
import { buildStylesheet } from '../styles/styles';
import iconPicture from '../images/icons/picture.png';
import iconEdit from '../images/icons/icon_edit.png';
import iconNewMessage from '../images/icons/icon_new_message.png';

const MessageInput = withChannelContext(
  class MessageInput extends PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        text: this.props.editing ? this.props.editing.text : '',
      };
    }

    static propTypes = {};

    componentDidMount() {
      if (this.props.editing) this.inputBox.focus();
    }

    componentDidUpdate(prevProps) {
      if (this.props.editing) this.inputBox.focus();
      if (
        this.props.editing &&
        prevProps.editing &&
        this.props.editing.id === prevProps.editing.id
      ) {
        return;
      }

      if (this.props.editing && !prevProps.editing) {
        this.setState({ text: this.props.editing.text });
      }

      if (
        this.props.editing &&
        prevProps.editing &&
        this.props.editing.id !== prevProps.editing.id
      ) {
        this.setState({ text: this.props.editing.text });
      }
    }

    sendMessage = async () => {
      if (!this.state.text) return;

      try {
        await this.props.sendMessage({
          text: this.state.text,
          parent: this.props.parent,
        });
        this.setState({ text: '' });
      } catch (err) {
        console.log('Fialed');
      }
    };

    updateMessage = async () => {
      // const {reaction_counts, ...messageWithoutRactionCount} = this.props.editing;
      try {
        await this.props.client.updateMessage({
          ...this.props.editing,
          text: this.state.text,
        });

        this.setState({ text: '' });
        this.props.clearEditingState();
      } catch (err) {
        console.log(err);
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
      const styles = buildStylesheet('MessageInput', this.props.style);

      return (
        <React.Fragment>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.pictureButton}
              title="Pick an image from camera roll"
            >
              <Image source={iconPicture} />
            </TouchableOpacity>
            <TextInput
              ref={(o) => (this.inputBox = o)}
              style={styles.inputBox}
              placeholder="Write your message"
              onChangeText={this.handleChange}
              numberOfLines={3}
              value={this.state.text}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              title="Pick an image from camera roll"
              onPress={
                this.props.editing ? this.updateMessage : this.sendMessage
              }
            >
              {this.props.editing ? (
                <Image source={iconEdit} />
              ) : (
                <Image source={iconNewMessage} />
              )}
            </TouchableOpacity>
          </View>
          {/* <Text style={{ textAlign: 'right', height: 20 }}>
          {this.props.channel.state.typing
            ? this.constructTypingString(this.props.channel.state.typing)
            : ''}
        </Text> */}
        </React.Fragment>
      );
    }
  },
);

export { MessageInput };
