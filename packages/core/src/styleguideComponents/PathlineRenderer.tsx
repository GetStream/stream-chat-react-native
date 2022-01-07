import React from 'react';

import copy from 'clipboard-copy';
import { MdContentCopy } from 'react-icons/md';
import Link from 'react-styleguidist/lib/client/rsg-components/Link';
import Styled, { JssInjectedProps } from 'react-styleguidist/lib/client/rsg-components/Styled';
import ToolbarButton from 'react-styleguidist/lib/client/rsg-components/ToolbarButton';
import * as Rsg from 'react-styleguidist/lib/typings';

export const styles = ({ color, fontFamily, fontSize, space }: Rsg.Theme) => ({
  copyButton: {
    marginLeft: space[0],
  },
  pathline: {
    color: color.light,
    fontFamily: fontFamily.monospace,
    fontSize: fontSize.small,
    wordBreak: 'break-all',
  },
});

export const PathlineRenderer: React.FunctionComponent<JssInjectedProps> = ({
  children,
  classes,
}) => (
  <div className={classes.pathline}>
    <Link
      href={'https://github.com/GetStream/stream-chat-react-native/blob/master/' + children}
      rel='noopener'
      target='blank'
    >
      {children}
    </Link>
    <ToolbarButton
      className={classes.copyButton}
      onClick={() => children && copy(children.toString())}
      small
      title='Copy to clipboard'
    >
      <MdContentCopy />
    </ToolbarButton>
  </div>
);

export default Styled<JssInjectedProps>(styles)(PathlineRenderer);
