import React, { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { Portal } from 'react-native-teleport';

import {
  MessageOverlayTargetProvider,
  useMessageContext,
  useMessageOverlayRuntimeContext,
} from '../../contexts/messageContext/MessageContext';
import { useStableCallback } from '../../hooks';

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

export const MessageOverlayWrapper = ({
  children,
  targetId,
  testID,
}: MessageOverlayWrapperProps) => {
  const { registerMessageOverlayTarget, unregisterMessageOverlayTarget } = useMessageContext();
  const { messageOverlayTargetId, overlayActive } = useMessageOverlayRuntimeContext();
  const placeholderLayoutRef = useRef({ h: 0, w: 0 });
  const isActiveTarget = messageOverlayTargetId === targetId;

  const handleTargetRef = useCallback(
    (view: View | null) => {
      registerMessageOverlayTarget({
        id: targetId,
        view,
      });
    },
    [registerMessageOverlayTarget, targetId],
  );

  const handleLayout = useStableCallback((event: LayoutChangeEvent) => {
    const {
      nativeEvent: {
        layout: { height, width },
      },
    } = event;

    placeholderLayoutRef.current = {
      h: height,
      w: width,
    };
  });

  useEffect(
    () => () => {
      unregisterMessageOverlayTarget(targetId);
    },
    [targetId, unregisterMessageOverlayTarget],
  );

  const placeholderLayout = placeholderLayoutRef.current;
  const target = (
    <View collapsable={false} onLayout={handleLayout} ref={handleTargetRef} testID={testID}>
      <MessageOverlayTargetProvider value={isActiveTarget}>{children}</MessageOverlayTargetProvider>
    </View>
  );

  if (!isActiveTarget) {
    return children;
  }

  return (
    <>
      <Portal hostName={overlayActive ? 'message-overlay' : undefined}>{target}</Portal>
      {overlayActive ? (
        <View
          pointerEvents='none'
          style={{
            height: placeholderLayout.h,
            width: placeholderLayout.w > 0 ? placeholderLayout.w : '100%',
          }}
          testID={testID ? `${testID}-placeholder` : 'message-overlay-wrapper-placeholder'}
        />
      ) : null}
    </>
  );
};
