import React from 'react';
import PropTypes from 'prop-types';
import Styled, { JssInjectedProps } from 'react-styleguidist/lib/client/rsg-components/Styled';
import Argument, { ArgumentProps } from 'react-styleguidist/lib/client/rsg-components/Argument';
import Heading from 'react-styleguidist/lib/client/rsg-components/Heading';
import * as Rsg from 'react-styleguidist/lib/typings';

export const styles = ({ space }: Rsg.Theme) => ({
  headingWrapper: {
    marginBottom: space[0],
  },
  root: {
    fontSize: 'inherit',
    marginBottom: space[2],
  },
});

interface ArgumentsProps extends JssInjectedProps {
  args: ArgumentProps[];
  classes: Record<string, string>;
  heading?: boolean;
}

export const ArgumentsRenderer: React.FunctionComponent<ArgumentsProps> = ({
  args,
  classes,
  heading,
}) => {
  if (args.length === 0) {
    return null;
  }

  return (
    <div className={classes.root}>
      {heading && (
        <div className={classes.headingWrapper}>
          <Heading level={5}>Arguments</Heading>
        </div>
      )}
      {args.map((arg) => (
        <Argument key={arg.name} {...arg} block />
      ))}
    </div>
  );
};

ArgumentsRenderer.propTypes = {
  args: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      name: PropTypes.string.isRequired,
      type: PropTypes.object,
    }).isRequired,
  ).isRequired,
  classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
  heading: PropTypes.bool,
};

export default Styled<ArgumentsProps>(styles)(ArgumentsRenderer);
