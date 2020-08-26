import React from 'react';
import { Image } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

const StyledTouchableOpacity = styled.TouchableOpacity`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  padding: 5px;
  ${({ theme }) => theme.iconSquare.container.css};
`;

const StyledView = styled.View`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  padding: 5px;
  ${({ theme }) => theme.iconSquare.container.css};
`;

export const IconSquare = ({ icon, onPress }) =>
  onPress ? (
    <StyledTouchableOpacity onPress={onPress} testID='icon-square'>
      <Image source={icon} style={{ height: 15, width: 15 }} />
    </StyledTouchableOpacity>
  ) : (
    <StyledView testID='icon-square'>
      <Image source={icon} style={{ height: 15, width: 15 }} />
    </StyledView>
  );

IconSquare.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.shape({
      headers: PropTypes.objectOf(PropTypes.string),
      uri: PropTypes.string,
    }),
    PropTypes.number,
    PropTypes.arrayOf(
      PropTypes.shape({
        headers: PropTypes.objectOf(PropTypes.string),
        height: PropTypes.number,
        uri: PropTypes.string,
        width: PropTypes.number,
      }),
    ),
  ]),
  onPress: PropTypes.func,
};
