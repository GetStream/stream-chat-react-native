import React from 'react';
import {
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { styled } from '../styles/styledComponents';

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

type Props = {
  icon: ImageSourcePropType;
  onPress?: (event: GestureResponderEvent) => void;
};

export const IconSquare: React.FC<Props> = ({ icon, onPress }) =>
  onPress ? (
    <StyledTouchableOpacity onPress={onPress} testID='icon-square'>
      <Image source={icon} style={{ height: 15, width: 15 }} />
    </StyledTouchableOpacity>
  ) : (
    <StyledView testID='icon-square'>
      <Image source={icon} style={{ height: 15, width: 15 }} />
    </StyledView>
  );
