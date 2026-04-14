import { useMessageContext, useMessageOverlayTargetContext } from '../../../contexts';
import { useIsOverlayActive } from '../../../state-store';

export const useShouldUseOverlayStyles = () => {
  const { hasCustomMessageOverlayTarget, messageOverlayId } = useMessageContext();
  const isWithinMessageOverlayTarget = useMessageOverlayTargetContext();
  const { active, closing } = useIsOverlayActive(messageOverlayId);

  if (!active || closing) {
    return false;
  }

  return hasCustomMessageOverlayTarget ? isWithinMessageOverlayTarget : true;
};
