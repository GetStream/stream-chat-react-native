import React from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const NewGroupIcon: React.FC<IconProps> = ({
  active,
  color,
  height,
  width,
}) => {
  const {
    theme: {
      colors: {black},
    },
  } = useTheme();

  return (
    <Svg
      fill="none"
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}>
      <G opacity={active ? 1 : 0.5}>
        <Path
          clipRule="evenodd"
          d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM14 7C14 8.10457 13.1046 9 12 9C10.8954 9 10 8.10457 10 7C10 5.89543 10.8954 5 12 5C13.1046 5 14 5.89543 14 7Z"
          fill={color || black}
          fillRule="evenodd"
        />
        <Path
          d="M6.5 5C5.11929 5 4 6.11929 4 7.5C4 8.88071 5.11929 10 6.5 10"
          stroke={color || black}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <Path
          d="M17.9168 20.0014C17.9715 19.6758 18 19.3412 18 19C18 15.6863 15.3137 13 12 13C8.68629 13 6 15.6863 6 19C6 19.3423 6.02866 19.6779 6.08372 20.0045"
          stroke={color || black}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <Path
          d="M4.22429 12.9957C2.86734 14.0957 2 15.776 2 17.659C2 18.0012 2.02866 18.3369 2.08372 18.6635"
          stroke={color || black}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <Path
          d="M18 5C19.3807 5 20.5 6.11929 20.5 7.5C20.5 8.88071 19.3807 10 18 10"
          stroke={color || black}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <Path
          d="M20 12.9957C21.3569 14.0957 22.2243 15.776 22.2243 17.659C22.2243 18.0012 22.1956 18.3369 22.1406 18.6635"
          stroke={color || black}
          strokeLinecap="round"
          strokeWidth="2"
        />
      </G>
    </Svg>
  );
};
