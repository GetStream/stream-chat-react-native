import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Logo: React.FC<IconProps> = (props) => {
  const height = props.height || 40;
  const width = props.width || 80;
  return (
    <RootSvg {...props} height={height} viewBox={'0 0 80 40'} width={width}>
      <RootPath
        d='M52.298 12.856l25.607-1.815c1.69-.12 2.754 1.785 1.766 3.161l-17.913 24.95a2 2 0 01-1.624.834h-40.17a2 2 0 01-1.623-.831L.381 14.205c-.99-1.377.074-3.284 1.765-3.164l25.529 1.815L38.578.666a2 2 0 012.991.012L52.3 12.856zm5.363 23.175L41.043 29.82v6.21H57.66zm-18.618 0V29.82l-16.619 6.21h16.619zm-1.918-7.695l-16.979 6.338L7.655 17.311l29.47 11.025zm5.8 0l16.98 6.338 12.49-17.363-29.47 11.025zm-3.866-1.449V5.99L25.176 21.66l13.883 5.226zm1.984 0V5.992l13.883 15.67-13.883 5.225zm-19.938-6.67l3.194-3.59L8.693 15.51l12.412 4.707zm37.725 0l-3.194-3.59L71.24 15.51 58.83 20.216z'
        pathFill='#006CFF'
        {...props}
      />
    </RootSvg>
  );
};
