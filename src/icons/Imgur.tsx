import React from 'react';
import { Circle } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Imgur: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <Circle
      cx={props.width ? props.width / 2 : 12}
      cy={props.height ? props.height / 2 : 12}
      fill='#08142D'
      r={props.height ? props.height / 2 : 12}
      {...props}
    />
    <RootPath
      d='M12.935 17.053c0 .662-.11 1.153-.33 1.47-.221.318-.56.477-1.019.477-.463 0-.808-.16-1.035-.48-.226-.32-.339-.81-.339-1.467v-5.378c0-.657.112-1.144.335-1.462.223-.318.57-.477 1.04-.477.457 0 .797.159 1.018.477.22.318.33.805.33 1.462v5.378z'
      pathFill='#FFFFFF'
      {...props}
    />
    <RootPath
      d='M10 6.55c0-.426.155-.79.466-1.094A1.545 1.545 0 0111.586 5c.43 0 .798.152 1.103.456.306.304.458.668.458 1.093 0 .431-.151.796-.454 1.094a1.518 1.518 0 01-1.107.447c-.446 0-.822-.149-1.128-.447A1.471 1.471 0 0110 6.55z'
      pathFill='#5BBF8C'
      {...props}
    />
  </RootSvg>
);
