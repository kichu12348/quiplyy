import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import NetInfo from '@react-native-community/netinfo';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const[isAuth,setIsAuth]=useState(false)
  const[isConnected,setIsConnected]=useState(false)

  useEffect(() => {
    const attemptConnection = () => {
      NetInfo.fetch().then(state => {
        setIsConnected(state.isConnected);
      });
      const socket = io("https://quiplyserver.onrender.com"); // change this to your server address
      socket.on("connect", () => {
        setSocket(socket);
        setIsLoading(false);
      });

      socket.on('connect_error', () => {
        setTimeout(attemptConnection, 10000);
      });
    };

    attemptConnection();

    return () => {
      socket?.disconnect();
    };
  }, []); 

  useEffect(()=>{
    if(socket){
      socket.emit('joinSocket',socket?.id);
    }
  },[socket])


  const value = useMemo(() => {
    return { socket, isLoading,isAuth,setIsAuth,isConnected};
  }, [socket, isLoading,isAuth,isConnected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};


export { SocketProvider, useSocket };
