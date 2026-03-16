import { useMessageContext } from '../../../contexts';
import { useIsOverlayActive } from '../../../state-store';

export const useShouldUseOverlayStyles = () => {
  const { messageOverlayId } = useMessageContext();
  const { active, closing } = useIsOverlayActive(messageOverlayId);

  return active && !closing;
};
