import { useState, useMemo, createContext, useContext} from "react";
import { useAuth } from "./authContext";


const MessagerContext = createContext();

const MessagerProvider = ({ children }) => {

  const auth = useAuth();
  
  const [selectedContact, setSelectedContact] = useState(null);

  const randomUID = (len=32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-!@#$%^&()";
    let str = "";
    for (let i = 0; i < len; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };
  


  const value = useMemo(() => {
    return {
      selectedContact,
      setSelectedContact,
      randomUID,
    };
  }, [selectedContact]);

  return (
    <MessagerContext.Provider value={value}>
      {children}
    </MessagerContext.Provider>
  );
};

const useMessager = () => {
  const context = useContext(MessagerContext);
  return context;
};

export { MessagerProvider, useMessager };
