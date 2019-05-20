import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/styles.js';
import Moment from 'moment';

export const DateSeparator = ({ message, formatDate, date }) => (
  <View style={styles.DateSeparator.container} collapsable={false}>
    <View style={styles.DateSeparator.dividingLines} />
    <Text style={styles.DateSeparator.date}>
      {formatDate
        ? formatDate(date)
        : Moment(message.date.toISOString()).calendar(null, {
            lastDay: '[Yesterday]',
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            lastWeek: '[Last] dddd',
            nextWeek: 'dddd',
            sameElse: 'L',
          })}
    </Text>
    <View style={styles.DateSeparator.dividingLines} />
  </View>
);
