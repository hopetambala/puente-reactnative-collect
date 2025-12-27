import React, { createContext, useState } from "react";

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

  return (
    <AlertContext.Provider
      value={{
        message,
        visible,
        alert,
        dismiss,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}
