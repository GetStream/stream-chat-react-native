import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, ClipPath, G, Mask } from 'react-native-svg';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export const ThreadListItemSkeleton = () => {
  const width = useWindowDimensions().width;
  const startOffset = useSharedValue(-width);
  const styles = useStyles();

  const {
    theme: {
      channelListSkeleton: { animationTime = 1500, container, height = 112 },
      semantics,
    },
  } = useTheme();

  useEffect(() => {
    startOffset.value = withRepeat(
      withTiming(width, {
        duration: animationTime,
        easing: Easing.linear,
      }),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: startOffset.value }],
    }),
    [],
  );

  return (
    <View style={[styles.container, container]} testID='channel-preview-skeleton'>
      <Animated.View style={[animatedStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 402 112`} fill='none'>
          <Mask id='path-1-inside-1_6371_335396'>
            <Path d='M0 0H402V112H0V0Z' fill='white' />
          </Mask>
          <Path
            d='M402 112V111H0V112V113H402V112Z'
            fill={semantics.backgroundCoreSurface}
            mask='url(#path-1-inside-1_6371_335396)'
          />
          <G clip-path='url(#clip0_6371_335396)'>
            <Path
              d='M16 40C16 26.7452 26.7452 16 40 16C53.2548 16 64 26.7452 64 40C64 53.2548 53.2548 64 40 64C26.7452 64 16 53.2548 16 40Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='48'
              height='48'
              transform='translate(16 16)'
              fill='url(#paint0_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip1_6371_335396)'>
            <Path
              d='M76 26C76 22.6863 78.6863 20 82 20H190C193.314 20 196 22.6863 196 26C196 29.3137 193.314 32 190 32H82C78.6863 32 76 29.3137 76 26Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='120'
              height='12'
              transform='translate(76 20)'
              fill='url(#paint1_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip2_6371_335396)'>
            <Path
              d='M76 50C76 44.4772 80.4772 40 86 40H316C321.523 40 326 44.4772 326 50C326 55.5228 321.523 60 316 60H86C80.4772 60 76 55.5228 76 50Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='250'
              height='20'
              transform='translate(76 40)'
              fill='url(#paint2_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip3_6371_335396)'>
            <Path
              d='M76 84C76 77.3726 81.3726 72 88 72C94.6274 72 100 77.3726 100 84C100 90.6274 94.6274 96 88 96C81.3726 96 76 90.6274 76 84Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='24'
              height='24'
              transform='translate(76 72)'
              fill='url(#paint3_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip4_6371_335396)'>
            <Path
              d='M108 84C108 80.6863 110.686 78 114 78H166C169.314 78 172 80.6863 172 84C172 87.3137 169.314 90 166 90H114C110.686 90 108 87.3137 108 84Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='64'
              height='12'
              transform='translate(108 78)'
              fill='url(#paint4_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip5_6371_335396)'>
            <Path
              d='M180 84C180 80.6863 182.686 78 186 78H238C241.314 78 244 80.6863 244 84C244 87.3137 241.314 90 238 90H186C182.686 90 180 87.3137 180 84Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='64'
              height='12'
              transform='translate(180 78)'
              fill='url(#paint5_linear_6371_335396)'
            />
          </G>
          <G clip-path='url(#clip6_6371_335396)'>
            <Path
              d='M338 24C338 19.5817 341.582 16 346 16H378C382.418 16 386 19.5817 386 24C386 28.4183 382.418 32 378 32H346C341.582 32 338 28.4183 338 24Z'
              fill={semantics.backgroundCoreSurface}
            />
            <Rect
              width='48'
              height='16'
              transform='translate(338 16)'
              fill='url(#paint6_linear_6371_335396)'
            />
          </G>
          <Defs>
            <LinearGradient
              id='paint0_linear_6371_335396'
              x1='48'
              y1='24'
              x2='-1.5262e-07'
              y2='24'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint1_linear_6371_335396'
              x1='120'
              y1='6'
              x2='-3.8155e-07'
              y2='5.99999'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint2_linear_6371_335396'
              x1='250'
              y1='10'
              x2='-7.94895e-07'
              y2='9.99998'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint3_linear_6371_335396'
              x1='24'
              y1='12'
              x2='-7.63101e-08'
              y2='12'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint4_linear_6371_335396'
              x1='64'
              y1='6'
              x2='-2.03494e-07'
              y2='6'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint5_linear_6371_335396'
              x1='64'
              y1='6'
              x2='-2.03494e-07'
              y2='6'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <LinearGradient
              id='paint6_linear_6371_335396'
              x1='48'
              y1='8'
              x2='-1.5262e-07'
              y2='8'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='white' />
              <Stop offset='1' stopColor='white' stopOpacity='0' />
            </LinearGradient>
            <ClipPath id='clip0_6371_335396'>
              <Path
                d='M16 40C16 26.7452 26.7452 16 40 16C53.2548 16 64 26.7452 64 40C64 53.2548 53.2548 64 40 64C26.7452 64 16 53.2548 16 40Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip1_6371_335396'>
              <Path
                d='M76 26C76 22.6863 78.6863 20 82 20H190C193.314 20 196 22.6863 196 26C196 29.3137 193.314 32 190 32H82C78.6863 32 76 29.3137 76 26Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip2_6371_335396'>
              <Path
                d='M76 50C76 44.4772 80.4772 40 86 40H316C321.523 40 326 44.4772 326 50C326 55.5228 321.523 60 316 60H86C80.4772 60 76 55.5228 76 50Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip3_6371_335396'>
              <Path
                d='M76 84C76 77.3726 81.3726 72 88 72C94.6274 72 100 77.3726 100 84C100 90.6274 94.6274 96 88 96C81.3726 96 76 90.6274 76 84Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip4_6371_335396'>
              <Path
                d='M108 84C108 80.6863 110.686 78 114 78H166C169.314 78 172 80.6863 172 84C172 87.3137 169.314 90 166 90H114C110.686 90 108 87.3137 108 84Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip5_6371_335396'>
              <Path
                d='M180 84C180 80.6863 182.686 78 186 78H238C241.314 78 244 80.6863 244 84C244 87.3137 241.314 90 238 90H186C182.686 90 180 87.3137 180 84Z'
                fill='white'
              />
            </ClipPath>
            <ClipPath id='clip6_6371_335396'>
              <Path
                d='M338 24C338 19.5817 341.582 16 346 16H378C382.418 16 386 19.5817 386 24C386 28.4183 382.418 32 378 32H346C341.582 32 338 28.4183 338 24Z'
                fill='white'
              />
            </ClipPath>
          </Defs>
        </Svg>
      </Animated.View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        borderBottomWidth: 1,
        flexDirection: 'row',
        borderBottomColor: semantics.borderCoreDefault,
      },
    });
  }, [semantics]);
};
