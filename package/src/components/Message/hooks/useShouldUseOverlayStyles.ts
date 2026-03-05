import { useMessageContext } from '../../../contexts';
import { useIsOverlayActive } from '../../../state-store';

export const useShouldUseOverlayStyles = () => {
  const { message } = useMessageContext();
  const { active, closing } = useIsOverlayActive(message?.id);

  return active && !closing;
};
