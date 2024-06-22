import { useState, createContext, useContext, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useSocket } from "./socketContext";
import * as SQLite from "expo-sqlite";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  axios.defaults.baseURL = "https://quiplyserver.onrender.com/user";
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [contacts, setContacts] = useState(null);
  const { socket, setIsAuth, isConnected } = useSocket();

  const setData = async (token, user) => {
    const db = await SQLite.openDatabaseAsync("user.db");
    db.execAsync(`
    CREATE TABLE IF NOT EXISTS user (
        token TEXT,
        username TEXT,
        id TEXT
        );
    `);
    db.runAsync(`INSERT INTO user (token,username,id) VALUES (?, ?, ?)`, [
      token,
      user.username,
      user.id,
    ]);
  };

  const getData = async () => {
    const db = await SQLite.openDatabaseAsync("user.db");
    db.execAsync(`
      CREATE TABLE IF NOT EXISTS user (
          token TEXT,
          username TEXT,
          id TEXT
          );
      `);
    const rows = await db.getAllAsync("SELECT * FROM user");
    return rows;
  };

  const removeData = async () => {
    const db = await SQLite.openDatabaseAsync("user.db");
    db.execAsync(`
    DROP TABLE IF EXISTS user
    `);
  };

  const removeMessages = async () => {
    const db = await SQLite.openDatabaseAsync("messages.db");
    db.execAsync(`
      DROP TABLE IF EXISTS messages
      `);
  };

  const login = async (username, password) => {
    await axios
      .post("/login", { username, password })
      .then(async (res) => {
        if (res.data.success) {
          await setData(res.data.token, res.data.user);
          setToken(res.data.token);
          setUser(res.data.user);
          socket?.emit("joinID", { id: res.data.user.id });
          setIsAuth(true);
        } else {
          setIsAuth(false);
          Alert.alert(res.data.error);
        }
      })
      .catch((e) => {
        setIsAuth(false);
        Alert.alert("error: " + e.message);
      });
  };

  const signup = async (username, password) => {
    await axios
      .post("/signup", { username, password })
      .then(async (res) => {
        if (res.data.success) {
          await setData(res.data.token, res.data.user);
          setToken(res.data.token);
          setUser(res.data.user);
          socket?.emit("joinID", { id: res.data.user.id });
          setIsAuth(true);
        } else {
          setIsAuth(false);
          Alert.alert(res.data.error);
        }
      })
      .catch((e) => {
        setIsAuth(false);
        Alert.alert("error: " + e.message);
      });
  };

  const checkAuth = async () => {
    const [token] = await getData();

    if (token && socket) {
      setUser({ username: token.username, id: token.id });
      setToken(token.token);
      socket?.emit("joinID", { id: token.id });
      setIsAuth(true);
      if (!isConnected) return;
      await axios
        .post("/auth", { token })
        .then((res) => {
          if (res.data.success) {
            return;
          }
          setIsAuth(false);
        })
        .catch(() => {
          setIsAuth(false);
        });
      return;
    }
    setIsAuth(false);
  };

  const logOut = async () => {
    await removeData();
    await removeMessages();
    setUser(null);
    setToken(null);
    setIsAuth(false);
    setContacts(null);
  };

  const addContact = async (contactId) => {
    if (!isConnected) return;
    await axios
      .post("/addContact", { contactId, token })
      .then(async (res) => {
        if (res.data.success) {
          setContacts(res.data.contact);
          socket.emit("contactAdded", {
            contactId,
            data: {
              id: user?.id,
              username: user?.username,
              roomID: res.data.contact.roomID,
            },
          });
        } else {
          Alert.alert(res.data.error);
        }
      })
      .catch((e) => {
        Alert.alert("error:1 " + e.message);
      });
  };

  const getContacts = async () => {
    if (!isConnected) return;
    if (!token) return;
    const resp = await axios.post("/getContacts", { token });
    if (resp.data.success) {
      return resp.data.contacts;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [socket, isConnected]);

  const value = useMemo(() => {
    return {
      login,
      signup,
      checkAuth,
      user,
      token,
      logOut,
      contacts,
      setContacts,
      getContacts,
      addContact,
    };
  }, [user, token, contacts]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export { AuthProvider, useAuth };
