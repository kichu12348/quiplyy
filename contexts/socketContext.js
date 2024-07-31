import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as SQLite from "expo-sqlite";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const endPoint = "https://quiplyserver.onrender.com"; //https://quiplyserver.onrender.com
  const SUPABASE_URL = "https://vevcjimdxdaprqrdbptj.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldmNqaW1keGRhcHJxcmRicHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE4NzMxMTAsImV4cCI6MjAyNzQ0OTExMH0.8p3Ho0QJ0h-3ANpQLa_qX05PCqWu22X2l2YdL4dBss8";

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const isLoggedIn = async () => {
    if (isAuth) return;
    const db = await SQLite.openDatabaseAsync("user.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user (
          token TEXT,
          username TEXT,
          id TEXT
          );
      `);
    const row = await db.getFirstAsync("SELECT * FROM user");
    if (row) {
      setIsAuth(true);
    }
  };

  useEffect(() => {
    const attemptConnection = () => {
      if (!isLoading) return;
      NetInfo.fetch().then((state) => {
        setIsConnected(state.isConnected);
      });
      isLoggedIn();
      const socket = io(endPoint);
      socket.on("connect", async () => {
        setIsLoading(false);
        setSocket(socket);
      });

      socket.on("connect_error", () => {
        setTimeout(attemptConnection, 10000);
      });
    };

    attemptConnection();

    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("joinSocket", socket?.id);
    }
  }, [socket]);

  const value = useMemo(() => {
    return {
      socket,
      isLoading,
      isAuth,
      setIsAuth,
      isConnected,
      endPoint,
      supabase,
    };
  }, [socket, isLoading, isAuth, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

export { SocketProvider, useSocket };
