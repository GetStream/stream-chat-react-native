// @noflow
import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-styleguidist/lib/rsg-components/Link';
import Styled from 'react-styleguidist/lib/rsg-components/Styled';

export const styles = ({ color, fontFamily, fontSize, space }) => ({
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

export function PathlineRenderer({ children, classes }) {
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
