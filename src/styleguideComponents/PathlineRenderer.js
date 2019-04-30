// @noflow
import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-styleguidist/lib/rsg-components/Link';
import Styled from 'react-styleguidist/lib/rsg-components/Styled';

export const styles = ({ space, fontFamily, fontSize, color }) => ({
  pathline: {
    fontFamily: fontFamily.monospace,
    fontSize: fontSize.small,
    color: color.light,
    wordBreak: 'break-all',
  },
  copyButton: {
    marginLeft: space[0],
  },
});

export function PathlineRenderer({ classes, children }) {
  const source = children;

  return (
    <div className={classes.pathline}>
      <Link
        href={
          'https://github.com/GetStream/react-file-utils/blob/master/' + source
        }
        target="blank"
        rel="noopener"
      >
        {source}
      </Link>
    </div>
  );
}

PathlineRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.string,
};

export default Styled(styles)(PathlineRenderer);
