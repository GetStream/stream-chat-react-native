import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const UserDelete: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M12 11a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z' {...props} />
    <RootPath
      d='M12 12c-5.531 0-8 3.632-8 6a1 1 0 11-2 0c0-3.632 3.531-8 10-8 1.995 0 3.714.412 5.14 1.1a1 1 0 11-.868 1.8c-1.137-.547-2.556-.9-4.272-.9zM21.828 15.586l-1.414-1.414L19 15.586l-1.414-1.414-1.414 1.414L17.586 17l-1.414 1.414 1.414 1.414L19 18.414l1.414 1.414 1.414-1.414L20.414 17l1.414-1.414z'
      {...props}
    />
  </RootSvg>
);
