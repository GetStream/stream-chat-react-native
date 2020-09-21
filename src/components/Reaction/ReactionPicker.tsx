import React from 'react';
import { Modal, View } from 'react-native';

import type { UnknownType, UserResponse } from 'stream-chat';

import type { LatestReactions, Reaction } from './ReactionList';

import Avatar from '../Avatar/Avatar';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';
import { emojiData } from '../../utils/utils';

import type { MessageWithDates } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultUserType } from '../../types/types';

const Container = styled.TouchableOpacity<{ leftAlign: boolean }>`
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

const getLatestUser = <Us extends UnknownType = DefaultUserType>(
  reactions: LatestReactions,
  type: string,
) => {
  const filtered = getUsersPerReaction(reactions, type);
  if (filtered && filtered[0] && filtered[0].user) {
    return filtered[0].user as UserResponse<Us>;
  } else {
    return 'NotFound';
  }
};

const getUsersPerReaction = (reactions: LatestReactions, type: string) => {
  const filtered = reactions?.filter((item) => item.type === type);
  return filtered;
};

export type ReactionPickerProps = {
  handleDismiss: () => void;
  handleReaction: (arg: string) => void;
  hideReactionCount: boolean;
  hideReactionOwners: boolean;
  latestReactions: LatestReactions;
  reactionPickerVisible: boolean;
  reactionCounts?: MessageWithDates['reaction_counts'];
  rpLeft?: number;
  rpRight?: number;
  rpTop?: number;
  supportedReactions?: Reaction[];
};

// TODO: change from using Modal to reanimated view to save on rendering and performance
const ReactionPicker: React.FC<ReactionPickerProps> & { themePath: string } = ({
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
            const count = reactionCounts?.[id] || 0;
            return (
              <Column key={id} testID={id}>
                {latestUser !== 'NotFound' && !hideReactionOwners ? (
                  <Avatar
                    image={latestUser.image}
                    name={latestUser.name || latestUser.id}
                    size={18}
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

export default themed(ReactionPicker);
