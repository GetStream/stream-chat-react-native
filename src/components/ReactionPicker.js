import React from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import { emojiData } from '../utils';

export class ReactionPicker extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      reactionPickerVisible,
      handleDismiss,
      handleReaction,
      rpLeft,
      rpTop,
      rpRight,
    } = this.props;

    if (!reactionPickerVisible) return null;

    const position = {
      marginTop: rpTop,
    };

    if (rpLeft) position.marginLeft = rpLeft;

    if (rpRight) position.marginRight = rpRight;

    return (
      <Modal
        visible={reactionPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        {reactionPickerVisible && (
          <TouchableOpacity
            onPress={handleDismiss}
            style={{
              flex: 1,
              alignItems: rpLeft ? 'flex-start' : 'flex-end',
            }}
            activeOpacity={1}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: 'black',
                paddingLeft: 20,
                paddingTop: 10,
                paddingBottom: 10,
                paddingRight: 20,
                borderRadius: 30,
                ...position,
              }}
            >
              {emojiData.map(({ id, icon }) => (
                <Text
                  key={id}
                  style={{ fontSize: 30 }}
                  onPress={() => {
                    handleDismiss();
                    handleReaction(id);
                  }}
                >
                  {icon}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        )}
      </Modal>
    );
  }
}
