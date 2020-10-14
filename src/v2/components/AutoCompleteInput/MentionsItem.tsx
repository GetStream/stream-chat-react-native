import React from 'react';

import { Avatar } from '../Avatar/Avatar';

import { styled } from '../../../styles/styledComponents';

import type { SuggestionUser } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultUserType } from '../../types/types';

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

export type MentionsItemProps<Us extends DefaultUserType = DefaultUserType> = {
  /**
   * A UserResponse of suggested UserTypes with these properties
   *
   * - id: User ID of the suggested mention user
   * - image: Image to be shown as the Avatar for the user
   * - name: Name of the suggested mention user
   */
  item: SuggestionUser<Us>;
};

/**
 * @example ./MentionsItem.md
 */
export const MentionsItem = <Us extends DefaultUserType = DefaultUserType>({
  item: { id, image, name },
}: MentionsItemProps<Us>) => (
  <Container>
    <Avatar image={image} name={name} />
    <Name testID='mentions-item-name'>{name || id}</Name>
  </Container>
);
