import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTranslationContext } from '../../../contexts';

import type { Photo } from '../ImageGallery';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    height: 56,
  },
  imageCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

type Props = {
  opacity: Animated.SharedValue<number>;
  photo: Photo;
  photoLength: number;
  selectedIndex: number;
  visible: Animated.SharedValue<number>;
};

export const ImageGalleryFooter: React.FC<Props> = (props) => {
  const { opacity, photoLength, selectedIndex, visible } = props;
  const [height, setHeight] = useState(200);
  const { t } = useTranslationContext();

  const footerStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
      transform: [
        {
          translateY: interpolate(
            visible.value,
            [0, 1],
            [height, 0],
            Extrapolate.CLAMP,
          ),
        },
      ],
    }),
    [],
  );
  // t('{{ firstUser }} and {{ secondUser }} are typing...', {
  //   firstUser: nonSelfUsers[0],
  //   secondUser: nonSelfUsers[1],
  // });

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[styles.safeArea, footerStyle]}>
        <View style={styles.container}>
          <View style={styles.centerContainer}>
            <Text style={styles.imageCount}>
              {/* {t('{{ index }} of {{ photoLength }}', {
              photoLength,
              index: selectedIndex + 1,
            })} */}
              {`${selectedIndex + 1} of ${photoLength}`}
            </Text>
          </View>
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};
