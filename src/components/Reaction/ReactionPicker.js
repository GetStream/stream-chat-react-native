import React from 'react';
import { Modal, View } from 'react-native';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import Avatar from '../Avatar/Avatar';
import { themed } from '../../styles/theme';
import { emojiData } from '../../utils/utils';

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
  height: 60px;
  padding-right: 20px;
  border-radius: 30px;
  ${({ theme }) => theme.message.reactionPicker.containerView.css}
`;

const Column = styled.View`
  flex-direction: column;
  align-items: center;
  margin-top: -5px;
  ${({ theme }) => theme.message.reactionPicker.column.css}
`;

const Emoji = styled.Text`
  font-size: 20px;
  margin-bottom: 5px;
  margin-top: 5px;
  ${({ theme }) => theme.message.reactionPicker.emoji.css}
`;

const ReactionCount = styled.Text`
  color: white;
  font-size: 10px;
  font-weight: bold;
  ${({ theme }) => theme.message.reactionPicker.text.css}
`;

class ReactionPicker extends React.PureComponent {
  static themePath = 'message.reactionPicker';

  static propTypes = {
    handleDismiss: PropTypes.func,
    handleReaction: PropTypes.func,
    hideReactionCount: PropTypes.bool,
    hideReactionOwners: PropTypes.bool,
    latestReactions: PropTypes.array,
    reactionCounts: PropTypes.object,
    reactionPickerVisible: PropTypes.bool,
    rpLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rpRight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rpTop: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supportedReactions: PropTypes.array,
  };

  static defaultProps = {
    hideReactionCount: false,
    hideReactionOwners: false,
    rpLeft: 30,
    rpRight: 10,
    rpTop: 40,
    supportedReactions: emojiData,
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
      supportedReactions,
    } = this.props;

    if (!reactionPickerVisible) return null;

    const position = {
      marginTop: rpTop,
    };

    if (rpLeft) position.marginLeft = rpLeft;

    if (rpRight) position.marginRight = rpRight;

    return (
      <Modal
        animationType='fade'
        onRequestClose={handleDismiss}
        onShow={() => {}}
        transparent
        visible={reactionPickerVisible}
      >
        {reactionPickerVisible && (
          <Container
            activeOpacity={1}
            leftAlign={Boolean(rpLeft)}
            onPress={handleDismiss}
          >
            <ContainerView
              style={{
                ...position,
              }}
            >
              {supportedReactions.map(({ id, icon }) => {
                const latestUser = this.getLatestUser(latestReactions, id);
                const count = reactionCounts && reactionCounts[id];
                return (
                  <Column key={id}>
                    {latestUser !== 'NotFound' && !hideReactionOwners ? (
                      <Avatar
                        alt={latestUser.id}
                        image={latestUser.image}
                        name={latestUser.name || latestUser.id}
                        size={18}
                        style={{
                          image: {
                            borderColor: 'white',
                            borderWidth: 1,
                          },
                        }}
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
                    {!hideReactionCount && (
                      <ReactionCount>{count > 0 ? count : ''}</ReactionCount>
                    )}
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

export default themed(ReactionPicker);
