import React from 'react';
import { View, Modal } from 'react-native';

import styled from 'styled-components';
import { getTheme } from '../styles/theme';
import { emojiData } from '../utils';
import { Avatar } from './Avatar';

const Container = styled.TouchableOpacity`
  flex: ${(props) => getTheme(props).reactionPicker.container.flex};
  align-items: ${(props) =>
    props.left
      ? getTheme(props).reactionPicker.container.leftAlign
      : getTheme(props).reactionPicker.container.rightAlign};
`;

const ContainerView = styled.View`
  display: ${(props) => getTheme(props).reactionPicker.containerView.display};
  flex-direction: ${(props) =>
    getTheme(props).reactionPicker.containerView.flexDirection};
  background-color: ${(props) =>
    getTheme(props).reactionPicker.containerView.backgroundColor};
  padding-left: ${(props) =>
    getTheme(props).reactionPicker.containerView.paddingLeft};
  height: ${(props) => getTheme(props).reactionPicker.containerView.height};
  padding-right: ${(props) =>
    getTheme(props).reactionPicker.containerView.paddingRight};
  border-radius: ${(props) =>
    getTheme(props).reactionPicker.containerView.borderRadius};
`;

const Column = styled.View`
  flex-direction: ${(props) =>
    getTheme(props).reactionPicker.column.flexDirection};
  align-items: ${(props) => getTheme(props).reactionPicker.column.alignItems};
  margin-top: ${(props) => getTheme(props).reactionPicker.column.marginTop};
`;

const Emoji = styled.Text`
  font-size: ${(props) => getTheme(props).reactionPicker.emoji.fontSize};
  margin-bottom: ${(props) =>
    getTheme(props).reactionPicker.emoji.marginBottom};
  margin-top: ${(props) => getTheme(props).reactionPicker.emoji.marginTop};
`;

const ReactionCount = styled.Text`
  color: ${(props) => getTheme(props).reactionPicker.reactionCount.color};
  font-size: ${(props) =>
    getTheme(props).reactionPicker.reactionCount.fontSize};
  font-weight: ${(props) =>
    getTheme(props).reactionPicker.reactionCount.fontWeight};
`;

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
        onShow={() => {}}
        onRequestClose={handleDismiss}
      >
        {reactionPickerVisible && (
          <Container onPress={handleDismiss} left={!!rpLeft} activeOpacity={1}>
            <ContainerView
              style={{
                ...position,
              }}
            >
              {emojiData.map(({ id, icon }) => {
                const latestUser = this.getLatestUser(latestReactions, id);
                const count = reactionCounts && reactionCounts[id];
                return (
                  <Column key={id}>
                    {latestUser !== 'NotFound' ? (
                      <Avatar
                        image={latestUser.image}
                        alt={latestUser.id}
                        size={18}
                        style={{
                          image: {
                            borderColor: 'white',
                            borderWidth: 1,
                          },
                        }}
                        name={latestUser.id}
                      />
                    ) : (
                      <View style={{ height: 18, width: 18 }} />
                    )}
                    <Emoji
                      onPress={() => {
                        handleReaction(id);
                      }}
                    >
                      {icon}
                    </Emoji>
                    <ReactionCount>{count > 0 ? count : ''}</ReactionCount>
                  </Column>
                );
              })}
            </ContainerView>
          </Container>
        )}
      </Modal>
    );
  }
}
