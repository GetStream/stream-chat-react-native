import React, { PureComponent } from 'react';
import { Linking } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { getTheme } from '../styles/theme';

const Title = styled.Text`
  color: ${(props) => getTheme(props).hyperLink.title.color};
  font-weight: ${(props) => getTheme(props).hyperLink.title.fontWeight};
`;

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
    const { title } = this.props;

    return <Title onPress={this._goToURL}>{title}</Title>;
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
