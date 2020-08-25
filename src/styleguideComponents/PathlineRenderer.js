// @noflow
import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-styleguidist/lib/rsg-components/Link';
import Styled from 'react-styleguidist/lib/rsg-components/Styled';

export const styles = ({ space, fontFamily, fontSize, color }) => ({
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

export function PathlineRenderer({ classes, children }) {
  const source = children;

  return (
    <div className={classes.pathline}>
      <Link
        href={
          'https://github.com/GetStream/stream-chat-react-native/blob/master/' +
          source
        }
        rel='noopener'
        target='blank'
      >
        {source}
      </Link>
    </div>
  );
}

PathlineRenderer.propTypes = {
  children: PropTypes.string,
  classes: PropTypes.object.isRequired,
};

export default Styled(styles)(PathlineRenderer);
