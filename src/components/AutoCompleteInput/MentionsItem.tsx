import React from 'react';

import Avatar from '../Avatar/Avatar';

import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

import type { SuggestionUser } from '../../contexts/suggestionsContext/SuggestionsContext';

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.mention.container.css}
`;

const Name = styled.Text`
  color: black;
  font-weight: bold;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.mention.name.css}
`;

type Props = {
  /**
   * A UserResponse of suggested UserTypes with these properties
   *
   * - id: User ID of the suggested mention user
   * - image: Image to be shown as the Avatar for the user
   * - name: Name of the suggested mention user
   */
  item: SuggestionUser;
};

/**
 * @example ./MentionsItem.md
 */
const MentionsItem: React.FC<Props> & { themePath: string } = ({
  item: { id, image, name },
}) => (
  <Container>
    <Avatar image={image} name={name} />
    <Name testID='mentions-item-name'>{name || id}</Name>
  </Container>
);

MentionsItem.themePath = 'messageInput.suggestions.mention';

export default themed(MentionsItem);
