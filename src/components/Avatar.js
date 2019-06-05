import React from 'react';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const BASE_AVATAR_FALLBACK_TEXT_SIZE = 14;
const BASE_AVATAR_SIZE = 32;

const AvatarContainer = styled.View`
  display: flex;
  align-items: center;
  ${({ theme }) => theme.avatar.container.css}
`;

const AvatarImage = styled.Image`
  border-radius: ${({ size }) => size / 2};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  ${({ theme }) => theme.avatar.image.css}
`;

const AvatarFallback = styled.View`
  border-radius: ${({ size }) => size / 2};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: ${({ theme }) => theme.colors.primary};
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.avatar.fallback.css}
`;

const AvatarText = styled.Text`
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: uppercase;
  font-size: ${({ fontSize }) => fontSize};
  font-weight: bold;
  ${({ theme }) => theme.avatar.text.css}
`;

/**
 * Avatar - A round avatar image with fallback to user's initials
 *
 * @example ./docs/Avatar.md
 * @extends PureComponent
 */
export const Avatar = themed(
  class Avatar extends React.PureComponent {
    static themePath = 'avatar';
    static propTypes = {
      /** image url */
      image: PropTypes.string,
      /** name of the picture, used for title tag fallback */
      name: PropTypes.string,
      /** size in pixels */
      size: PropTypes.number,
      /** Style overrides */
      style: PropTypes.object,
    };

    static defaultProps = {
      size: 32,
    };

    state = {
      imageError: false,
    };

    setError = () => {
      this.setState({
        imageError: true,
      });
    };

    getInitials = (name) =>
      name
        ? name
            .split(' ')
            .slice(0, 2)
            .map((name) => name.charAt(0))
        : null;

    render() {
      const { size, name, image } = this.props;
      const initials = this.getInitials(name);
      const fontSize =
        BASE_AVATAR_FALLBACK_TEXT_SIZE * (size / BASE_AVATAR_SIZE);

      return (
        <AvatarContainer>
          {image && !this.state.imageError ? (
            <AvatarImage
              size={size}
              source={{ uri: image }}
              accessibilityLabel="initials"
              resizeMethod="resize"
              onError={this.setError}
            />
          ) : (
            <AvatarFallback size={size}>
              <AvatarText fontSize={fontSize}>{initials}</AvatarText>
            </AvatarFallback>
          )}
        </AvatarContainer>
      );
    }
  },
);
