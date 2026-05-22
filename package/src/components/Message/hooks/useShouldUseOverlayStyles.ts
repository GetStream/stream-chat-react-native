import {
  useMessageContext,
  useMessageOverlayRuntimeContext,
  useMessageOverlayTargetContext,
} from '../../../contexts';
import { useIsOverlayActive } from '../../../state-store';
import { DEFAULT_MESSAGE_OVERLAY_TARGET_ID } from '../messageOverlayConstants';

export const useShouldUseOverlayStyles = () => {
  const { messageOverlayId } = useMessageContext();
  const { messageOverlayTargetId } = useMessageOverlayRuntimeContext();
  const isWithinMessageOverlayTarget = useMessageOverlayTargetContext();
  const { active, closing } = useIsOverlayActive(messageOverlayId);

  if (!active || closing) {
    return false;
  }

  return messageOverlayTargetId === DEFAULT_MESSAGE_OVERLAY_TARGET_ID
    ? true
    : isWithinMessageOverlayTarget;
};
