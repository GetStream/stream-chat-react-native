import React from 'react';
import { View, Modal } from 'react-native';

import styled from '@stream-io/styled-components';
import { emojiData } from '../utils';
import { Avatar } from './Avatar';

const Container = styled.TouchableOpacity`
  flex: ${({ theme }) => theme.reactionPicker.container.flex};
  align-items: ${({ theme, left }) =>
    left
      ? theme.reactionPicker.container.leftAlign
      : theme.reactionPicker.container.rightAlign};
`;

const ContainerView = styled.View`
  display: ${({ theme }) => theme.reactionPicker.containerView.display};
  flex-direction: ${({ theme }) =>
    theme.reactionPicker.containerView.flexDirection};
  background-color: ${({ theme }) =>
    theme.reactionPicker.containerView.backgroundColor};
  padding-left: ${({ theme }) =>
    theme.reactionPicker.containerView.paddingLeft};
  height: ${({ theme }) => theme.reactionPicker.containerView.height};
  padding-right: ${({ theme }) =>
    theme.reactionPicker.containerView.paddingRight};
  border-radius: ${({ theme }) =>
    theme.reactionPicker.containerView.borderRadius};
`;

const Column = styled.View`
  flex-direction: ${({ theme }) => theme.reactionPicker.column.flexDirection};
  align-items: ${({ theme }) => theme.reactionPicker.column.alignItems};
  margin-top: ${({ theme }) => theme.reactionPicker.column.marginTop};
`;

const Emoji = styled.Text`
  font-size: ${({ theme }) => theme.reactionPicker.emoji.fontSize};
  margin-bottom: ${({ theme }) => theme.reactionPicker.emoji.marginBottom};
  margin-top: ${({ theme }) => theme.reactionPicker.emoji.marginTop};
`;

const ReactionCount = styled.Text`
  color: ${({ theme }) => theme.reactionPicker.reactionCount.color};
  font-size: ${({ theme }) => theme.reactionPicker.reactionCount.fontSize};
  font-weight: ${({ theme }) => theme.reactionPicker.reactionCount.fontWeight};
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
