import React from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import { emojiData } from '../utils';
import { Avatar } from './Avatar';
import { buildStylesheet } from '../styles/styles.js';

export class ReactionPicker extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  getUsersPerReaction = (reactions, type) => {
    const filtered =
      reactions && reactions.filter((item) => item.type === type);
    return filtered;
  };

  getLatestUser = (reactions, type) => {
    const filtered = this.getUsersPerReaction(reactions, type);
    if (filtered && filtered[0] && filtered[0].user) {
      return filtered[0].user;
    } else {
      return 'NotFound';
    }
  };

  render() {
    const {
      reactionPickerVisible,
      handleDismiss,
      handleReaction,
      latestReactions,
      reactionCounts,
      rpLeft,
      rpTop,
      rpRight,
      style,
    } = this.props;

    if (!reactionPickerVisible) return null;

    const position = {
      marginTop: rpTop,
    };

    if (rpLeft) position.marginLeft = rpLeft;

    if (rpRight) position.marginRight = rpRight;

    const styles = buildStylesheet('ReactionPicker', style);

    return (
      <Modal
        visible={reactionPickerVisible}
        transparent
        animationType="fade"
        onShow={() => {}}
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
                ...styles.container,
                ...position,
              }}
            >
              {emojiData.map(({ id, icon }) => {
                const latestUser = this.getLatestUser(latestReactions, id);
                const count = reactionCounts && reactionCounts[id];
                return (
                  <View key={id} style={styles.reactionColumn}>
                    {latestUser !== 'NotFound' ? (
                      <Avatar
                        image={latestUser.image}
                        alt={latestUser.id}
                        size={20}
                        style={{
                          image: {
                            borderColor: 'white',
                            borderWidth: 1,
                          },
                        }}
                        name={latestUser.id}
                      />
                    ) : (
                      <View style={{ height: 20, width: 20 }} />
                    )}
                    <Text
                      style={{ fontSize: 30 }}
                      onPress={() => {
                        handleReaction(id);
                      }}
                    >
                      {icon}
                    </Text>
                    <Text style={styles.reactionCount}>
                      {count > 0 ? count : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        )}
      </Modal>
    );
  }
}
