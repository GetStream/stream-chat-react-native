import React, { PureComponent } from 'react';
import { Text, Linking } from 'react-native';
import PropTypes from 'prop-types';

import { buildStylesheet } from '../styles/styles';

export class HyperLink extends PureComponent {
  constructor() {
    super();
    this._goToURL = this._goToURL.bind(this);
  }

  static propTypes = {
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  };

  render() {
    const { title, style } = this.props;

    const styles = buildStylesheet('HyperLink', style);

    return (
      <Text style={styles.title} onPress={this._goToURL}>
        {title}
      </Text>
    );
  }

  _goToURL = () => {
    const { url } = this.props;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(this.props.url);
      } else {
        console.log("Don't know how to open URI: " + this.props.url);
      }
    });
  };
}
