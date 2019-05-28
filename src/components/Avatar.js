import React from 'react';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

const AvatarContainer = styled.View`
  display: flex;
  align-items: center;
  ${({ theme }) => theme.avatar.container.extra}
`;

const AvatarImage = styled.Image`
  border-radius: ${({ size }) => size / 2};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  ${({ theme }) => theme.avatar.image.extra}
`;

const AvatarFallback = styled.View`
  border-radius: ${({ size }) => size / 2};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: ${({ theme }) => theme.colors.primary};
  justify-content: ${({ theme }) => theme.avatar.fallback.justifyContent};
  align-items: ${({ theme }) => theme.avatar.fallback.alignItems};
  ${({ theme }) => theme.avatar.fallback.extra}
`;

const AvatarText = styled.Text`
  color: ${({ theme }) => theme.avatar.text.color};
  text-transform: ${({ theme }) => theme.avatar.text.textTransform};
  font-size: ${({ theme }) => theme.avatar.text.fontSize};
  font-weight: ${({ theme }) => theme.avatar.text.fontWeight};
  ${({ theme }) => theme.avatar.text.extra}
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
      /** shape of the avatar, circle, rounded or square */
      shape: PropTypes.oneOf(['circle', 'rounded', 'square']),
      /** size in pixels */
      size: PropTypes.number,
      /** Style overrides */
      style: PropTypes.object,
    };

    static defaultProps = {
      shape: 'circle',
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
              <AvatarText>{initials}</AvatarText>
            </AvatarFallback>
          )}
        </AvatarContainer>
      );
    }
  },
);
