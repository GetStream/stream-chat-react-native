import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { UnknownType } from '../../types/types';

export type AttachmentPickerContextValue = {
  closePicker: () => void;
  openPicker: () => void;
};

export const AttachmentPickerContext = React.createContext<AttachmentPickerContextValue>(
  {} as AttachmentPickerContextValue,
);

export const AttachmentPickerProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: AttachmentPickerContextValue;
}>) => (
  <AttachmentPickerContext.Provider
    value={(value as unknown) as AttachmentPickerContextValue}
  >
    {children}
  </AttachmentPickerContext.Provider>
);

export const useAttachmentPickerContext = () =>
  (useContext(
    AttachmentPickerContext,
  ) as unknown) as AttachmentPickerContextValue;

export const withAttachmentPickerContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof AttachmentPickerContextValue>> => {
  const WithAttachmentPickerContextComponent = (
    props: Omit<P, keyof AttachmentPickerContextValue>,
  ) => {
    const attachmentPickerContext = useAttachmentPickerContext();

    return <Component {...(props as P)} {...attachmentPickerContext} />;
  };
  WithAttachmentPickerContextComponent.displayName = `WithAttachmentPickerContext${getDisplayName(
    Component,
  )}`;
  return WithAttachmentPickerContextComponent;
};
