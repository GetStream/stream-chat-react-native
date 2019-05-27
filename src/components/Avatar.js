import React from 'react';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';

const AvatarContainer = styled.View`
  display: flex;
  align-items: center;
`;

const AvatarImage = styled.Image`
  border-radius: ${(props) =>
    props.theme.avatarImage.borderRadius || props.size / 2};
  width: ${(props) => props.theme.avatarImage.width || props.size};
  height: ${(props) => props.theme.avatarImage.height || props.size};
`;

const AvatarFallback = styled.View`
  border-radius: ${(props) =>
    props.theme.avatarImage.borderRadius || props.size / 2};
  width: ${(props) => props.theme.avatarImage.width || props.size};
  height: ${(props) => props.theme.avatarImage.height || props.size};
  background-color: ${(props) => props.theme.colors.primary};
  justify-content: ${(props) => props.theme.avatarFallback.justifyContent};
  align-items: ${(props) => props.theme.avatarFallback.alignItems};
`;

const AvatarText = styled.Text`
  color: ${(props) => props.theme.avatarText.color};
  text-transform: ${(props) => props.theme.avatarText.textTransform};
  font-size: ${(props) => props.theme.avatarText.fontSize};
  font-weight: ${(props) => props.theme.avatarText.fontWeight};
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
}
