import React, { PropsWithChildren, useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { Portal } from 'react-native-teleport';

import {
  MessageOverlayTargetProvider,
  useMessageContext,
  useMessageOverlayRuntimeContext,
} from '../../contexts/messageContext/MessageContext';

export type MessageOverlayWrapperProps = PropsWithChildren<{
  /**
   * Stable identifier for this overlay target. Must match `messageOverlayTargetId`
   * when this subtree should be teleported into the overlay.
   */
  targetId: string;
  /**
   * Optional test id attached to the wrapped target container.
   */
  testID?: string;
}>;

/**
 * Wraps the primary message overlay target so the active message can be teleported
 * into the overlay host while a placeholder preserves its original layout space.
 */
export const MessageOverlayWrapper = ({
  children,
  targetId,
  testID,
}: MessageOverlayWrapperProps) => {
  const { registerMessageOverlayTarget, unregisterMessageOverlayTarget } = useMessageContext();
  const { messageOverlayTargetId, overlayActive, overlayTargetRectRef } =
    useMessageOverlayRuntimeContext();
  const isActiveTarget = messageOverlayTargetId === targetId;
  const placeholderLayout = overlayTargetRectRef.current;

  const handleTargetRef = useCallback(
    (view: View | null) => {
      registerMessageOverlayTarget({
        id: targetId,
        view,
      });
    },
    [registerMessageOverlayTarget, targetId],
  );

  useEffect(
    () => () => {
      unregisterMessageOverlayTarget(targetId);
    },
    [targetId, unregisterMessageOverlayTarget],
  );

  if (!isActiveTarget) {
    return children;
  }

  return (
    <>
      <Portal hostName={overlayActive ? 'message-overlay' : undefined}>
        <View collapsable={false} ref={handleTargetRef} testID={testID}>
          <MessageOverlayTargetProvider value={isActiveTarget}>
            {children}
          </MessageOverlayTargetProvider>
        </View>
      </Portal>
      {overlayActive ? (
        <View
          pointerEvents='none'
          style={{
            height: placeholderLayout?.h ?? 0,
            width: placeholderLayout?.w && placeholderLayout.w > 0 ? placeholderLayout.w : '100%',
          }}
          testID={testID ? `${testID}-placeholder` : 'message-overlay-wrapper-placeholder'}
        />
      ) : null}
    </>
  );
};
