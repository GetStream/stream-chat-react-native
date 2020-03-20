import React from 'react';
import { View, Modal } from 'react-native';
import { themed } from '../styles/theme';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';
import { Avatar } from './Avatar';

const Container = styled.TouchableOpacity`
  flex: 1;
  align-items: ${({ leftAlign }) => (leftAlign ? 'flex-start' : 'flex-end')};
  ${({ theme }) => theme.message.reactionPicker.container.css}
`;

const ContainerView = styled.View`
  display: flex;
  flex-direction: row;
  background-color: black;
  padding-left: 20px;
  height: 60;
  padding-right: 20px;
  border-radius: 30;
  ${({ theme }) => theme.message.reactionPicker.containerView.css}
`;

const Column = styled.View`
  flex-direction: column;
  align-items: center;
  margin-top: -5;
  ${({ theme }) => theme.message.reactionPicker.column.css}
`;

const Emoji = styled.Text`
  font-size: 20;
  margin-bottom: 5;
  margin-top: 5;
  ${({ theme }) => theme.message.reactionPicker.emoji.css}
`;

const ReactionCount = styled.Text`
  color: white;
  font-size: 10;
  font-weight: bold;
  ${({ theme }) => theme.message.reactionPicker.text.css}
`;

export const ReactionPicker = themed(
  class ReactionPicker extends React.PureComponent {
    static themePath = 'message.reactionPicker';

    static propTypes = {
      hideReactionCount: PropTypes.bool,
      hideReactionOwners: PropTypes.bool,
      reactionPickerVisible: PropTypes.bool,
      handleDismiss: PropTypes.func,
      handleReaction: PropTypes.func,
      latestReactions: PropTypes.array,
      reactionCounts: PropTypes.object,
      rpLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      rpTop: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      rpRight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      emojiData: PropTypes.array,
    };

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
        hideReactionCount,
        hideReactionOwners,
        reactionPickerVisible,
        handleDismiss,
        handleReaction,
        latestReactions,
        reactionCounts,
        rpLeft,
        rpTop,
        rpRight,
        emojiData,
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
                      {latestUser !== 'NotFound' && !hideReactionOwners ? (
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
                          name={latestUser.name || latestUser.id}
                        />
                      ) : (
                        !hideReactionOwners && (
                          <View style={{ height: 18, width: 18 }} />
                        )
                      )}
                      <Emoji
                        onPress={() => {
                          handleReaction(id);
                        }}
                      >
                        {icon}
                      </Emoji>
                      <ReactionCount>
                        {!hideReactionCount && count > 0 ? count : ''}
                      </ReactionCount>
                    </Column>
                  );
                })}
              </ContainerView>
            </Container>
          )}
        </Modal>
      );
    }
  },
);
