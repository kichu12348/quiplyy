import { useState, createContext, useContext, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useSocket } from "./socketContext";
import * as SQLite from "expo-sqlite";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [contacts, setContacts] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [story, setStory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const {
    socket,
    setIsAuth,
    isConnected,
    isAuth,
    isLoading,
    endPoint,
    supabase,
    setAllMessages,
  } = useSocket();

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

  //REMOVES DATA FROM LOCAL DB
  const removeData = async () => {
    try {
      const userDb = await SQLite.openDatabaseAsync("user.db");
      const contactsDb = await SQLite.openDatabaseAsync("contacts.db");
      const messagesDb = await SQLite.openDatabaseAsync("messages.db");
      await userDb.execAsync(`DROP TABLE IF EXISTS user`);
      await contactsDb.execAsync(`DROP TABLE IF EXISTS contacts`);
      await messagesDb.execAsync(`DROP TABLE IF EXISTS messages`);
      await AsyncStorage.removeItem("bio");
      await AsyncStorage.removeItem("personality");
    } catch (e) {
      return;
    }
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
          setProfilePicture(
            `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${res.data.user.username}.jpg`
          );
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
  const signup = async (username, password, imageUri) => {
    await axios
      .post("/signup", { username, password })
      .then(async (res) => {
        if (res.data.success) {
          await setData(res.data.token, res.data.user);
          setToken(res.data.token);
          setUser(res.data.user);
          setProfilePicture(imageUri);
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

  //get all stories
  const getAllStories = async (user) => {
    const { data, error } = await supabase.from("story").select("*");
    if (error || data.length === 0) return;
    const currentTime = new Date().getTime();
    data.map(async (story) => {
      const storyTime = story.time;
      if (currentTime - storyTime > 86400000) {
        await supabase.storage.from("stories").remove([`${story.storyUri}`]);
        await supabase.from("story").delete().eq("id", story.id);
        return;
      }
      if (story.id === user.id) {
        setStory(
          `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/stories/${story.storyUri}`
        );
        return;
      }
      setAllStories((prev) => {
        const check = prev.find((item) => item.id === story.id);
        if (check) return prev;
        return [...prev, story];
      });
    });
  };

  //ION KNOW WHY THIS IS
  const checkAuth = async () => {
    const user = await getData();
    if (!token && isAuth && user) {
      setUser({ username: user.username, id: user.id });
      const publicUrl = getProfilePicture(user.username);
      await getAllStories(user);
      if (publicUrl) {
        setProfilePicture(publicUrl);
      } else {
        setProfilePicture(
          `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${user.username}.jpg`
        );
      }
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
    setUser(null);
    setToken(null);
    setIsAuth(false);
    setContacts([]);
    setAllMessages([]);
  };

  const addContact = async (contactId) => {
    if (!isConnected) return false;
    try {
      const res = await axios.post("/addContact", { contactId, token });

      if (res.data.success) {
        setContacts(res.data.contact);
        socket.emit("contactAdded", {
          contactId,
          data: {
            id: user?.id,
            username: user?.username,
            roomID: res.data.contact.roomID,
            isGroup: res.data.contact.isGroup,
            noOfMembers: res.data.contact.noOfMembers,
          },
        });
        return res.data.contact;
      } else {
        if (res.data.error === "Contact already exists") {
          return res.data.contact;
        }
        Alert.alert(res.data.error);
      }
    } catch (e) {
      return false;
    }
  };

  const getContacts = async () => {
    if (!isConnected && !token && !isAuth) return;
    try {
      const resp = await axios.post("/getContacts", { token });
      if (resp.data.success) {
        return resp.data.contacts;
      }
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [socket, isConnected, isAuth]);

  const getProfilePicture = (username) => {
    return `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${username}.jpg`;
  };

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
      profilePicture,
      setProfilePicture,
      getProfilePicture,
      story,
      setStory,
      allStories,
      messages,
      setMessages,
    };
  }, [user, story, token, contacts, profilePicture, allStories, messages]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export { AuthProvider, useAuth };
