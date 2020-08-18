import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';

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

const MentionsItem = ({ item: { id, image, name } }) => (
  <Container>
    <Avatar image={image} name={name} />
    <Name testID='mentions-item-name'>{name || id}</Name>
  </Container>
);

MentionsItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    image: PropTypes.string,
    name: PropTypes.string,
  }),
};

MentionsItem.themePath = 'messageInput.suggestions.mention';

export default themed(MentionsItem);
