import { useState, createContext, useContext, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useSocket } from "./socketContext";
import * as SQLite from "expo-sqlite";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [contacts, setContacts] = useState(null);
  const { socket, setIsAuth, isConnected, isAuth, isLoading,endPoint} = useSocket();

  axios.defaults.baseURL = `${endPoint}/user`;
  //SETTING DATA INTO DB LOCAL
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

  //GETTING DATA IF EXISTS FROM DB LOCALLY
  const getData = async () => {
    const db = await SQLite.openDatabaseAsync("user.db");
    db.execAsync(`
      CREATE TABLE IF NOT EXISTS user (
          token TEXT,
          username TEXT,
          id TEXT
          );
      `);
    const row = await db.getFirstAsync("SELECT * FROM user");
    return row;
  };

  //REMOVES CONTACTS DATA FROM LOCAL DB
  const removeData = async () => {
    const db = await SQLite.openDatabaseAsync("user.db");
    db.execAsync(`
    DROP TABLE IF EXISTS user
    `);
  };

  //REMOVES MESSAGES STORED IN LOACAL DB
  const removeMessages = async () => {
    const db = await SQLite.openDatabaseAsync("messages.db");
    db.execAsync(`
      DROP TABLE IF EXISTS messages
      `);
  };

  //LOGINS IN A USER
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
          if (isAuth) {
            setIsAuth(false);
          }
          Alert.alert(res.data.error);
        }
      })
      .catch((e) => {
        setIsAuth(false);
        Alert.alert("error: " + e.message);
      });
  };

  //REGISTERS A NEW USER
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

  //ION KNOW WHY THIS IS
  const checkAuth = async () => {
    const user = await getData();
    if (!token && isAuth && user) {
      setUser({ username: user.username, id: user.id });
      setToken(user.token);
    }
    if (user && socket && isAuth) {
      if (isConnected && socket && !isLoading) {
        socket?.emit("joinID", { id: user.id });
      }
    }
  };

  //CLEARS ALL DATA AND SIGNS OUT
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
        return;
      });
  };

  const getContacts = async () => {
    if (!isConnected && !token && !isAuth) return;
    try {
      const resp = await axios.post("/getContacts", { token });
      if (resp.data.success) {
        return resp.data.contacts;
      }
    } catch (e) {
      console.log("error:getting contacts: " + e.message);
      return null;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [socket, isConnected, isAuth]);

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
