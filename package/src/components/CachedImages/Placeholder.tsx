import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const styles = StyleSheet.create({
  placeholder: {
    height: '50%',
    width: '50%',
  },
});

function PlaceholderSvg(props: SvgProps) {
  return (
    <View style={styles.placeholder}>
      <Svg fill='none' height='100%' viewBox='0 0 60 60' width='100%' {...props}>
        <Path
          clipRule='evenodd'
          d='M10 12.5h40a5 5 0 015 5v23.448L41.92 25.9a2.493 2.493 0 00-1.945-.9 2.506 2.506 0 00-1.928.938l-8.484 10.609L21.5 30.5a2.5 2.5 0 00-3.267.233L5.17 43.796A5.006 5.006 0 015 42.5v-25a5 5 0 015-5zM8.705 47.33c.413.111.847.17 1.295.17h40c1.14 0 2.192-.382 3.033-1.025L40.04 31.453l-8.087 10.11A2.5 2.5 0 0128.5 42l-8.266-6.2-11.53 11.53zM0 17.5c0-5.523 4.477-10 10-10h40c5.523 0 10 4.477 10 10v25c0 5.523-4.477 10-10 10H10c-5.523 0-10-4.477-10-10v-25z'
          fill='#B4B7BB'
          fillRule='evenodd'
        />
      </Svg>
    </View>
  );
}

export default PlaceholderSvg;
