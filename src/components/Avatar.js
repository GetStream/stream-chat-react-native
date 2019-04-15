import React from 'react';
import { View, Image, Text } from 'react-native';
import PropTypes from 'prop-types';
import { styles } from '../styles.js';

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
    style: PropTypes.object,
  };

  static defaultProps = {
    size: 32,
    shape: 'circle',
  };

  getInitials = (name) =>
    name
      ? name
          .split(' ')
          .slice(0, 1)
          .map((name) => name.charAt(0))
      : null;

  render() {
    const { size, name, shape, image, style } = this.props;
    const initials = this.getInitials(name);
    return (
      <View style={{ display: 'flex', alignItems: 'center' }}>
        {image ? (
          <Image
            style={{
              ...style,
              ...styles.Avatar.image,
              width: size,
              height: size,
            }}
            source={{ uri: image }}
            accessibilityLabel="initials"
            resizeMethod="resize"
          />
        ) : (
          <View
            style={{
              ...style,
              backgroundColor: '#EBEBEB',
              borderRadius: size / 2,
              width: size,
              height: size,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>{initials}</Text>
          </View>
        )}
      </View>
    );
  }
}
