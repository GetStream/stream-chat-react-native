import React from 'react';
import PropTypes from 'prop-types';

import { View, TouchableOpacity, Text } from 'react-native';
import { buildStylesheet } from '../styles/styles';

/**
 * AttachmentActions - The actions you can take on an attachment
 *
 * @example ./docs/AttachmentActions.md
 * @extends PureComponent
 */
export class AttachmentActions extends React.PureComponent {
  static propTypes = {
    // /** The id of the form input */
    // id: PropTypes.string.isRequired,
    /** The text for the form input */
    text: PropTypes.string,
    /** A list of actions */
    actions: PropTypes.array.isRequired,
    /** The handler to execute after selecting an action */
    actionHandler: PropTypes.func.isRequired,
  };

  render() {
    const { id, actions, actionHandler, style } = this.props;
    const styles = buildStylesheet('AttachmentActions', style);

    return (
      <View style={styles.container}>
        {actions.map((action) => (
          <TouchableOpacity
            key={`${id}-${action.value}`}
            style={{ ...styles.button, ...styles[action.style + 'Button'] }}
            onPress={actionHandler.bind(this, action.name, action.value)}
          >
            <Text style={styles[action.style + 'ButtonText']}>
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}
