import React, { createContext, useMemo, useState } from "react";

export const AlertContext = createContext();

export function AlertContextProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState();

  const alert = (msg) => {
    setMessage(msg);
    setVisible(true);
  };

  const dismiss = () => {
    setVisible(!visible);
  };

  const contextValue = useMemo(
    () => ({ message, visible, alert, dismiss }),
    [message, visible]
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
}
