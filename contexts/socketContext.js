import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as SQLite from "expo-sqlite";
import { createClient } from "@supabase/supabase-js";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [allMessages, setAllMessages] = useState([]);

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

  const getMessageFromDB = async () => {
    const db = await SQLite.openDatabaseAsync("messages.db");
    await db.execAsync(`CREATE TABLE IF NOT EXISTS messages (
        idx INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT,
        sender TEXT,
        senderName TEXT,
        msg TEXT,
        roomID TEXT,
        isSticker BOOLEAN DEFAULT 0,
        sticker TEXT DEFAULT NULL,
        isDeleted BOOLEAN DEFAULT 0,
        isGroup BOOLEAN DEFAULT 0,
        isImage BOOLEAN DEFAULT 0,
        imageUri TEXT DEFAULT NULL,
        isDownloaded BOOLEAN DEFAULT 0,
        time TEXT
      );`);

    const messages = await db.getAllAsync("SELECT * FROM messages");
    setAllMessages(messages);
  };

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
      checkIfConnectedInBackground();
    });

    socket.on("connect_error", () => {
      setTimeout(attemptConnection, 10000);
    });
  };
  useEffect(() => {
    getMessageFromDB();

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

  async function checkIfConnectedInBackground() {
    const state = await NetInfo.fetch();
    const timeOut = setTimeout(checkIfConnectedInBackground, 10000);
    if (!state.isConnected) {
      socket?.disconnect();
      setSocket(null);
      setIsConnected(false);
      clearTimeout(timeOut);
      return;
    }
  }

  const value = useMemo(() => {
    return {
      socket,
      isLoading,
      isAuth,
      setIsAuth,
      isConnected,
      endPoint,
      supabase,
      setAllMessages,
      allMessages,
    };
  }, [socket, isLoading, isAuth, isConnected, allMessages]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

export { SocketProvider, useSocket };
