import React from 'react';

import { Button } from '../../../../components/ui';

export type CooldownTimerProps = {
  seconds: number;
};

/**
 * Renders an amount of seconds left for a cooldown to finish.
 *
 * See `useCountdown` for an example of how to set a countdown
 * to use as the source of `seconds`.
 **/
export const CooldownTimer = (props: CooldownTimerProps) => {
  const { seconds } = props;

  return (
    <Button
      buttonStyle='primary'
      type='solid'
      state='disabled'
      size='sm'
      label={seconds.toString()}
      testID='cooldown-timer'
    />
  );
};
