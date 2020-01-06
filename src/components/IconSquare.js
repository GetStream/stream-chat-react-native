import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import PropTypes from 'prop-types';

export const IconSquare = ({ icon, onPress }) => {
  if (onPress)
    return (
      <TouchableOpacity
        style={{
          padding: 5,
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: 5,
        }}
        onPress={onPress}
      >
        <Image source={icon} style={{ height: 15, width: 15 }} />
      </TouchableOpacity>
    );
  else
    return (
      <View
        style={{
          padding: 5,
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: 5,
        }}
      >
        <Image source={icon} style={{ height: 15, width: 15 }} />
      </View>
    );
};

IconSquare.propTypes = {
  icon: PropTypes.string,
  onPress: PropTypes.func,
};
