import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import { themed } from '../../styles/theme';

const BASE_AVATAR_FALLBACK_TEXT_SIZE = 14;
const BASE_AVATAR_SIZE = 32;

const AvatarContainer = styled.View`
  align-items: center;
  ${({ theme }) => theme.avatar.container.css}
`;

const AvatarImage = styled.Image`
  border-radius: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;
  ${({ theme }) => theme.avatar.image.css}
`;

const AvatarFallback = styled.View`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  justify-content: center;
  width: ${({ size }) => size}px;
  ${({ theme }) => theme.avatar.fallback.css}
`;

const AvatarText = styled.Text`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ fontSize }) => fontSize}px;
  font-weight: bold;
  text-transform: uppercase;
  ${({ theme }) => theme.avatar.text.css}
`;

const getInitials = (fullName) =>
  fullName
    ? fullName
        .split(' ')
        .slice(0, 2)
        .map((name) => name.charAt(0))
    : null;

/**
 * Avatar - A round avatar image with fallback to user's initials
 *
 * @example ../docs/Avatar.md
 */
const Avatar = ({ image, name, size = BASE_AVATAR_SIZE }) => {
  const [imageError, setImageError] = useState(false);

  const fontSize = useMemo(
    () => BASE_AVATAR_FALLBACK_TEXT_SIZE * (size / BASE_AVATAR_SIZE),
    [size],
  );
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <AvatarContainer>
      {image && !imageError ? (
        <AvatarImage
          accessibilityLabel='initials'
          onError={() => setImageError(true)}
          resizeMethod='resize'
          size={size}
          source={{ uri: image }}
          testID='avatar-image'
        />
      ) : (
        <AvatarFallback size={size}>
          <AvatarText fontSize={fontSize} testID='avatar-text'>
            {initials}
          </AvatarText>
        </AvatarFallback>
      )}
    </AvatarContainer>
  );
};

Avatar.propTypes = {
  /** image url */
  image: PropTypes.string,
  /** name of the picture, used for title tag fallback */
  name: PropTypes.string,
  /** size in pixels */
  size: PropTypes.number,
};

Avatar.themePath = 'avatar';

// TODO: remove HOC and use a theme context provider
export default themed(Avatar);
