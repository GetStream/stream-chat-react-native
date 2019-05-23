import React from 'react';
import { View, Modal } from 'react-native';

import styled from 'styled-components';
import { emojiData } from '../utils';
import { Avatar } from './Avatar';

const Container = styled.TouchableOpacity`
  flex: ${(props) => props.theme.reactionPicker.container.flex};
  align-items: ${(props) =>
    props.left
      ? props.theme.reactionPicker.container.leftAlign
      : props.theme.reactionPicker.container.rightAlign};
`;

const ContainerView = styled.View`
  display: ${(props) => props.theme.reactionPicker.containerView.display};
  flex-direction: ${(props) =>
    props.theme.reactionPicker.containerView.flexDirection};
  background-color: ${(props) =>
    props.theme.reactionPicker.containerView.backgroundColor};
  padding-left: ${(props) =>
    props.theme.reactionPicker.containerView.paddingLeft};
  height: ${(props) => props.theme.reactionPicker.containerView.height};
  padding-right: ${(props) =>
    props.theme.reactionPicker.containerView.paddingRight};
  border-radius: ${(props) =>
    props.theme.reactionPicker.containerView.borderRadius};
`;

const Column = styled.View`
  flex-direction: ${(props) => props.theme.reactionPicker.column.flexDirection};
  align-items: ${(props) => props.theme.reactionPicker.column.alignItems};
  margin-top: ${(props) => props.theme.reactionPicker.column.marginTop};
`;

const Emoji = styled.Text`
  font-size: ${(props) => props.theme.reactionPicker.emoji.fontSize};
  margin-bottom: ${(props) => props.theme.reactionPicker.emoji.marginBottom};
  margin-top: ${(props) => props.theme.reactionPicker.emoji.marginTop};
`;

const ReactionCount = styled.Text`
  color: ${(props) => props.theme.reactionPicker.reactionCount.color};
  font-size: ${(props) => props.theme.reactionPicker.reactionCount.fontSize};
  font-weight: ${(props) =>
    props.theme.reactionPicker.reactionCount.fontWeight};
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
