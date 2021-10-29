import React, { ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Toast from 'react-native-easy-toast';

import type { ToastComponentProps } from 'react-native-easy-toast';

import { getDisplayName } from '../utils/getDisplayName';

import type { UnknownType } from '../../types/types';

export type ToastType = {
  close: (duration?: number) => void;
  show: (text: string | ReactNode, duration?: number, callback?: () => void) => void;
};

export const ToastContext = React.createContext(
  {} as {
    show: (text: string, duration?: number, callback?: () => void) => void;
  },
);

const styles = StyleSheet.create({
  fill: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
  text: {
    color: 'white',
    fontSize: 17,
  },
  toast: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    height: 48,
    margin: 8,
    width: 344,
  },
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toastRef = useRef<Toast>(null);

  const show = useCallback((text: string, duration?: number, callback?: () => void) => {
    const onPress = () => {
      if (toastRef.current) {
        toastRef.current.close(0);
      }
    };

    if (toastRef.current) {
      return toastRef.current.show(
        <TouchableWithoutFeedback onPress={onPress} style={styles.fill}>
          <View style={styles.fill}>
            <Text style={styles.text}>{text}</Text>
          </View>
        </TouchableWithoutFeedback>,
        duration,
        callback,
      );
    }
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <>
      <Toast
        fadeOutDuration={0}
        ref={toastRef}
        {...({
          style: styles.toast,
        } as unknown as ToastComponentProps)}
      />
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    </>
  );
};

export const useToastContext = () => useContext(ToastContext) as unknown as Toast;

export const withToastContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof Toast>> => {
  const WithToastContextComponent = (props: Omit<P, keyof Toast>) => {
    const toastContext = useToastContext();

    return <Component {...(props as P)} {...toastContext} />;
  };
  WithToastContextComponent.displayName = `WithToastContext${getDisplayName(Component)}`;
  return WithToastContextComponent;
};
