import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import Avatar from '../Avatar/Avatar';

import { themed } from '../../styles/theme';

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

/**
 * @example ../docs/MentionsItem.md
 */
const MentionsItem = ({ item: { id, image, name } }) => (
  <Container>
    <Avatar image={image} name={name} />
    <Name testID='mentions-item-name'>{name || id}</Name>
  </Container>
);

MentionsItem.propTypes = {
  item: PropTypes.shape({
    /**
     * User ID of the suggested mention user
     */
    id: PropTypes.string,
    /**
     * Image to be shown as the Avatar for the user
     */
    image: PropTypes.string,
    /**
     * Name of the suggested mention user
     */
    name: PropTypes.string,
  }),
};

MentionsItem.themePath = 'messageInput.suggestions.mention';

export default themed(MentionsItem);
