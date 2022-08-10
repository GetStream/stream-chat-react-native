import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const EmptySearchState: React.FC<IconProps> = ({height, width}) => {
  const {
    theme: {
      colors: {accent_red, grey_gainsboro},
    },
  } = useTheme();

  return (
    <Svg
      fill="none"
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}>
      <Path
        clipRule="evenodd"
        d="M74.567 101.133c26.27 0 47.566-21.296 47.566-47.566C122.133 27.297 100.837 6 74.567 6 48.297 6 27 27.296 27 53.567c0 26.27 21.296 47.566 47.567 47.566zm0 4c28.479 0 51.566-23.087 51.566-51.566C126.133 25.087 103.046 2 74.567 2 46.087 2 23 25.087 23 53.567c0 28.479 23.087 51.566 51.567 51.566z"
        fill={grey_gainsboro}
        fillRule="evenodd"
      />
      <Path
        clipRule="evenodd"
        d="M73 13a2 2 0 012-2c23.196 0 42 18.804 42 42a2 2 0 11-4 0c0-20.987-17.013-38-38-38a2 2 0 01-2-2z"
        fill={grey_gainsboro}
        fillRule="evenodd"
      />
      <Path
        d="M62.569 42.586c.78-.781 2.032-.781 2.813 0l8.61 8.609 8.609-8.61c.78-.78 2.033-.78 2.814 0 .78.781.78 2.033 0 2.814l-8.61 8.61 8.61 8.609c.78.78.78 2.033 0 2.813-.384.383-.9.59-1.4.59a1.94 1.94 0 01-1.4-.59l-8.609-8.609-8.61 8.61c-.382.382-.898.589-1.399.589a1.916 1.916 0 01-1.399-.59 1.982 1.982 0 010-2.813l8.58-8.61-8.61-8.609a1.983 1.983 0 010-2.813z"
        fill={accent_red}
        opacity={0.3}
      />
      <Path
        clipRule="evenodd"
        d="M9.586 119L36.49 92.096l2.828 2.828-26.904 26.904A2 2 0 019.586 119z"
        fill={grey_gainsboro}
        fillRule="evenodd"
      />
    </Svg>
  );
};
