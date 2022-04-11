import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Play } from '../../icons';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  roundedView: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    display: 'flex',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

export const VideoThumbnail = () => {
  const {
    theme: {
      messageSimple: {
        videoThumbnail: { container, roundedView },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, container]}>
      <View style={[styles.roundedView, roundedView]}>
        <Play height={24} pathFill={'#000'} width={24} />
      </View>
    </View>
  );
};
