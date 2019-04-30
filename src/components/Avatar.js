import React from 'react';
import { View, Image, Text } from 'react-native';
import PropTypes from 'prop-types';
import { buildStylesheet } from '../styles/styles.js';

/**
 * Avatar - A round avatar image with fallback to username's first letter
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
    size: 32,
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
    const { size, name, image, style } = this.props;
    const styles = buildStylesheet('Avatar', style);
    const initials = this.getInitials(name);
    return (
      <View
        style={{ display: 'flex', alignItems: 'center', ...styles.container }}
      >
        {image && !this.state.imageError ? (
          <Image
            style={{
              ...styles.image,
              borderRadius: size / 2,
              width: size,
              height: size,
            }}
            source={{ uri: image }}
            accessibilityLabel="initials"
            resizeMethod="resize"
            onError={this.setError}
          />
        ) : (
          <View
            style={{
              ...styles.fallback,
              borderRadius: size / 2,
              width: size,
              height: size,
            }}
          >
            <Text style={styles.fallbackText}>{initials}</Text>
          </View>
        )}
      </View>
    );
  }
}
