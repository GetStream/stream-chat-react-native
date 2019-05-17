import * as React from 'react';
import { View, Text } from 'react-native';
import { buildStylesheet } from '../styles/styles';

export class IconBadge extends React.Component {
  render() {
    const { children, showNumber, unread } = this.props;
    const styles = buildStylesheet('iconBadge', this.props.styles);

    return (
      <View>
        {children}
        {unread > 0 && (
          <View style={styles.icon}>
            <View style={styles.iconInner}>
              {showNumber && <Text style={styles.text}>{unread}</Text>}
            </View>
          </View>
        )}
      </View>
    );
  }
}
