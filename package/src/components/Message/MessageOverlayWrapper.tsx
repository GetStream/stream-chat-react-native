import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { Portal } from 'react-native-teleport';

import {
  MessageOverlayTargetProvider,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useStableCallback } from '../../hooks';
import { useIsOverlayActive } from '../../state-store';
import { generateRandomId } from '../../utils/utils';

export type MessageOverlayWrapperProps = PropsWithChildren<{
  /**
   * Marks this wrapper as the default whole-message overlay target.
   * Integrators should not set this manually.
   */
  isDefault?: boolean;
  /**
   * Optional test id attached to the wrapped target container.
   */
  testID?: string;
}>;

export const MessageOverlayWrapper = ({
  children,
  isDefault = false,
  testID,
}: MessageOverlayWrapperProps) => {
  const {
    activeMessageOverlayTargetId,
    messageOverlayId,
    registerMessageOverlayTarget,
    unregisterMessageOverlayTarget,
  } = useMessageContext();
  const { active: overlayActive } = useIsOverlayActive(messageOverlayId);
  const placeholderLayoutRef = useRef({ h: 0, w: 0 });
  const registrationIdRef = useRef(`message-overlay-target-${generateRandomId()}`);
  const registrationId = registrationIdRef.current;
  const isActiveTarget = activeMessageOverlayTargetId === registrationId;

  const handleTargetRef = useStableCallback((view: View | null) => {
    registerMessageOverlayTarget({
      id: registrationId,
      isDefault,
      view,
    });
  });

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
      unregisterMessageOverlayTarget(registrationId);
    },
    [registrationId, unregisterMessageOverlayTarget],
  );

  const placeholderLayout = placeholderLayoutRef.current;

  return (
    <>
      <Portal hostName={overlayActive && isActiveTarget ? 'message-overlay' : undefined}>
        <View collapsable={false} onLayout={handleLayout} ref={handleTargetRef} testID={testID}>
          <MessageOverlayTargetProvider value={isActiveTarget}>
            {children}
          </MessageOverlayTargetProvider>
        </View>
      </Portal>
      {overlayActive && isActiveTarget ? (
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
