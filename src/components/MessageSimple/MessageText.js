import React from 'react';
import { View } from 'react-native';
import { buildStylesheet } from '../../styles/styles.js';
import { renderText, capitalize } from '../../utils';

export const MessageText = ({ message, isMyMessage, style }) => {
  const pos = isMyMessage(message) ? 'right' : 'left';
  const groupStyles =
    (isMyMessage(message) ? 'right' : 'left') +
    capitalize(message.groupPosition[0]);

  if (!message.text) return false;

  const styles = buildStylesheet('MessageSimpleText', style);

  return (
    <React.Fragment>
      <View
        style={{
          ...styles.container,
          ...styles[pos],
          ...styles[groupStyles],
          ...styles[message.status],
        }}
      >
        {renderText(message)}
      </View>
    </React.Fragment>
  );
};
