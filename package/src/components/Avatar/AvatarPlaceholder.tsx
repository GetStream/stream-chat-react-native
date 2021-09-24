import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ImageProps, ImageURISource } from 'react-native';

const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const hues = new Array(360 / 5 + 1).fill(null).map((_, i) => i * 10);

class ColorGenerator {
  private static instance: ColorGenerator;
  private availableHues: Array<number>;
  private storedKeyColors: { [index: string]: number };

  private constructor() {
    this.availableHues = [...hues];
    this.storedKeyColors = {};
  }

  // Being a singleton avoids repetition accross components
  public static getInstance() {
    if (!ColorGenerator.instance) {
      ColorGenerator.instance = new ColorGenerator() as unknown as ColorGenerator;
    }
    return this.instance;
  }

  public randomHue(key: string | undefined): number {
    if (key && this.storedKeyColors[key]) return this.storedKeyColors[key];
    if (!this.availableHues.length) {
      this.availableHues = [...hues];
    }

    const min = Math.ceil(0);
    const max = Math.floor(this.availableHues.length - 1);
    const randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;

    // remove color from array in order to avoid repetitions
    this.availableHues.splice(randomIndex, 1);

    if (!this.availableHues[randomIndex]) return this.randomHue(key);
    if (key) {
      this.storedKeyColors[key] = this.availableHues[randomIndex];
    }
    return this.availableHues[randomIndex];
  }
}

function SvgComponent(
  props: Omit<ImageProps, 'source'> & {
    id: string | undefined;
    initials: string;
    source: ImageURISource;
  },
) {
  const color = useRef(ColorGenerator.getInstance().randomHue(props.id));

  return (
    <View
      style={[
        ...(props.style as Array<ImageProps['style']>),
        styles.wrapper,
        {
          backgroundColor: `hsl(${color.current}, 40%, 50%)`,
        },
      ]}
    >
      <Text style={styles.text}>{props.initials}</Text>
    </View>
  );
}

export default SvgComponent;
