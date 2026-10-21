import React from 'react';

import { Button } from '../../../../components/ui';
import { useCooldownRemaining } from '../../hooks/useCooldownRemaining';

/** Shows the seconds left of the channel cooldown. */
export const CooldownTimer = () => {
  const seconds = useCooldownRemaining();

  return (
    <Button
      variant='primary'
      type='solid'
      disabled={true}
      size='sm'
      label={seconds.toString()}
      testID='cooldown-timer'
    />
  );
};
