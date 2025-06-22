import React, { PropsWithChildren, useContext, useState } from 'react';



export const isAddMemberBottomSheetData = (
  data: BottomSheetOverlayData,
): data is Pick<{ channel: string }, 'channel'> => 'channel' in data;

export type BottomSheetOverlayData =
  | Pick<{ channel: string }, 'channel'>
  | {
      onConfirm: () => void;
      title: string;
      cancelText?: string;
      confirmText?: string;
      subtext?: string;
    };

export type BottomSheetOverlayContextValue = {
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<BottomSheetOverlayData>>;
  data?: BottomSheetOverlayData;
};

export const BottomSheetOverlayContext = React.createContext({} as BottomSheetOverlayContextValue);

export const BottomSheetOverlayProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: BottomSheetOverlayContextValue;
}>) => {
  const [data, setData] = useState(value?.data);

  const reset = () => {
    setData(value?.data);
  };

  const bottomSheetOverlayContext = {
    data,
    reset,
    setData,
  };
  return (
    <BottomSheetOverlayContext.Provider
      value={bottomSheetOverlayContext as BottomSheetOverlayContextValue}
    >
      {children}
    </BottomSheetOverlayContext.Provider>
  );
};

export const useBottomSheetOverlayContext = () =>
  useContext(BottomSheetOverlayContext) as unknown as BottomSheetOverlayContextValue;
