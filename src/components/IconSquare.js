import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

const StyledTouchableOpacity = styled(TouchableOpacity)`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  padding: 5px;
  ${({ theme }) => theme.iconSquare.container.css}
`;

const StyledView = styled.View`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  padding: 5px;
  ${({ theme }) => theme.iconSquare.container.css}
`;

export const IconSquare = ({ icon, onPress }) => {
  if (onPress)
    return (
      <StyledTouchableOpacity onPress={onPress}>
        <Image source={icon} style={{ height: 15, width: 15 }} />
      </StyledTouchableOpacity>
    );
  else
    return (
      <StyledView>
        <Image source={icon} style={{ height: 15, width: 15 }} />
      </StyledView>
    );
};

IconSquare.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onPress: PropTypes.func,
};
