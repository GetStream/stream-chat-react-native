import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const StreamLogo: React.FC<IconProps> = ({height = 40, width = 80}) => {
  const {
    theme: {
      colors: {accent_blue},
    },
  } = useTheme();

  return (
    <Svg
      fill="none"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}>
      <Path
        clipRule="evenodd"
        d="M52.2984 12.8561L77.9046 11.0409C79.5948 10.9211 80.659 12.8259 79.6708 14.2023L61.7582 39.1527C61.3826 39.6759 60.7778 39.9863 60.1336 39.9863H19.9646C19.3214 39.9863 18.7174 39.6769 18.3414 39.1547L0.381197 14.2043C-0.609403 12.8281 0.454797 10.9207 2.1464 11.0409L27.6746 12.8563L38.578 0.666539C39.377 -0.226661 40.777 -0.221461 41.5694 0.677939L52.2984 12.8561ZM57.6608 36.0305L41.0426 29.8199V36.0305H57.6608ZM39.0426 36.0305V29.8199L22.4244 36.0305H39.0426ZM37.125 28.3363L20.146 34.6743L7.6548 17.3111L37.125 28.3363ZM42.9256 28.3363L59.9046 34.6743L72.3958 17.3111L42.9256 28.3363ZM39.0586 26.8871V5.98954L25.1758 21.6611L39.0586 26.8871ZM41.0426 26.8871V5.99214L54.9256 21.6611L41.0426 26.8871ZM21.1046 20.2165L24.2988 16.6273L8.6934 15.5089L21.1046 20.2165ZM58.8298 20.2165L55.6358 16.6273L71.2412 15.5089L58.8298 20.2165Z"
        fill={accent_blue}
        fillRule="evenodd"
      />
    </Svg>
  );
};
