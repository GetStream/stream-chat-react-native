import React from 'react';
import { Modal, View } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import Avatar from '../Avatar/Avatar';

import { themed } from '../../styles/theme';
import { emojiData } from '../../utils/utils';

const Container = styled.TouchableOpacity`
  align-items: ${({ leftAlign }) => (leftAlign ? 'flex-start' : 'flex-end')};
  flex: 1;
  ${({ theme }) => theme.message.reactionPicker.container.css}
`;

const ContainerView = styled.View`
  background-color: black;
  border-radius: 30px;
  flex-direction: row;
  height: 60px;
  padding-horizontal: 20px;
  ${({ theme }) => theme.message.reactionPicker.containerView.css}
`;

const Column = styled.View`
  align-items: center;
  margin-top: -5px;
  ${({ theme }) => theme.message.reactionPicker.column.css}
`;

const Emoji = styled.Text`
  font-size: 20px;
  margin-vertical: 5px;
  ${({ theme }) => theme.message.reactionPicker.emoji.css}
`;

const ReactionCount = styled.Text`
  color: white;
  font-size: 10px;
  font-weight: bold;
  ${({ theme }) => theme.message.reactionPicker.text.css}
`;

const getLatestUser = (reactions, type) => {
  const filtered = getUsersPerReaction(reactions, type);
  if (filtered && filtered[0] && filtered[0].user) {
    return filtered[0].user;
  } else {
    return 'NotFound';
  }
};

const getUsersPerReaction = (reactions, type) => {
  const filtered = reactions && reactions.filter((item) => item.type === type);
  return filtered;
};

// TODO: change from using Modal to reanimated view to save on rendering and performance
const ReactionPicker = ({
  handleDismiss,
  handleReaction,
  hideReactionCount = false,
  hideReactionOwners = false,
  latestReactions,
  reactionCounts,
  reactionPickerVisible,
  rpLeft = 30,
  rpRight = 10,
  rpTop = 40,
  supportedReactions = emojiData,
}) =>
  reactionPickerVisible ? (
    <Modal
      animationType='fade'
      onRequestClose={handleDismiss}
      onShow={() => {}}
      testID='reaction-picker'
      transparent
      visible={reactionPickerVisible}
    >
      <Container
        activeOpacity={1}
        leftAlign={Boolean(rpLeft)}
        onPress={handleDismiss}
      >
        <ContainerView
          style={{
            marginLeft: rpLeft ?? undefined,
            marginRight: rpRight ?? undefined,
            marginTop: rpTop,
          }}
        >
          {supportedReactions.map(({ icon, id }) => {
            const latestUser = getLatestUser(latestReactions, id);
            const count = reactionCounts && reactionCounts[id];
            return (
              <Column key={id} testID={id}>
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
                  onPress={() => handleReaction(id)}
                  testID={`${id}-reaction`}
                >
                  {icon}
                </Emoji>
                {!hideReactionCount && (
                  <ReactionCount testID={`${id}-${count || 'count'}`}>
                    {count > 0 ? count : ''}
                  </ReactionCount>
                )}
              </Column>
            );
          })}
        </ContainerView>
      </Container>
    </Modal>
  ) : null;

ReactionPicker.themePath = 'message.reactionPicker';

ReactionPicker.propTypes = {
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

export default themed(ReactionPicker);
