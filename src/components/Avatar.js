import React from 'react';
import PropTypes from 'prop-types';
import { getTheme } from '../styles/theme';

import styled from 'styled-components';

const AvatarContainer = styled.View`
  display: flex;
  align-items: center;
`;

const AvatarImage = styled.Image`
  width: ${(props) => props.size || getTheme(props).avatarImage.size};
  height: ${(props) => props.size || getTheme(props).avatarImage.size};
  border-radius: ${(props) =>
    props.size / 2 || getTheme(props).avatarImage.size / 2};
`;

const AvatarFallback = styled.View`
  border-radius: ${(props) =>
    props.size / 2 || getTheme(props).avatarImage.size / 2};
  width: ${(props) => props.size || getTheme(props).avatarImage.size};
  height: ${(props) => props.size || getTheme(props).avatarImage.size};
  background-color: ${(props) => getTheme(props).colors.primary};
  justify-content: ${(props) => getTheme(props).avatarFallback.justifyContent};
  align-items: ${(props) => getTheme(props).avatarFallback.alignItems};
`;

const AvatarText = styled.Text`
  color: ${(props) => getTheme(props).avatarText.color};
  text-transform: ${(props) => getTheme(props).avatarText.textTransform};
  font-size: ${(props) => getTheme(props).avatarText.fontSize};
  font-weight: ${(props) => getTheme(props).avatarText.fontWeight};
`;

/**
 * Avatar - A round avatar image with fallback to user's initials
 *
 * @example ./docs/Avatar.md
 * @extends PureComponent
 */
export class Avatar extends React.PureComponent {
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
}
