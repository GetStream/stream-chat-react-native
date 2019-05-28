import React from 'react';
import { View, Modal } from 'react-native';

import styled from '@stream-io/styled-components';
import { emojiData } from '../utils';
import { Avatar } from './Avatar';

const Container = styled.TouchableOpacity`
  flex: 1;
  align-items: ${({ leftAlign }) => (leftAlign ? 'flex-start' : 'flex-end')};
  ${({ theme }) => theme.reactionPicker.container.extra}
`;

const ContainerView = styled.View`
  display: flex;
  flex-direction: row;
  background-color: black;
  padding-left: 20px;
  height: 60;
  padding-right: 20px;
  border-radius: 30;
  ${({ theme }) => theme.reactionPicker.containerView.extra}
`;

const Column = styled.View`
  flex-direction: column;
  align-items: center;
  margin-top: -5;
  ${({ theme }) => theme.reactionPicker.column.extra}
`;

const Emoji = styled.Text`
  font-size: 20;
  margin-bottom: 5;
  margin-top: 5;
  ${({ theme }) => theme.reactionPicker.emoji.extra}
`;

const ReactionCount = styled.Text`
  color: white;
  font-size: 10;
  font-weight: bold;
  ${({ theme }) => theme.reactionPicker.text.extra}
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
          <Container
            onPress={handleDismiss}
            leftAlign={Boolean(rpLeft)}
            activeOpacity={1}
          >
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
