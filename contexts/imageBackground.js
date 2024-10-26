import { createContext, useContext, useMemo, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSocket } from "./socketContext";
import { useAuth } from "./authContext";

const backgroundContext = createContext();

export function BackgroundProvider({ children }) {
  const { isConnected, supabase } = useSocket();
  const {user}=useAuth();

  const [background, setBackground] = useState(null);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchBackgrounds() {
    if (!isConnected || !user) return;
    const { data, error } = await supabase.from("backgroundImages").select("*");
    if (error) {
      console.log(error);
    } else {
      setBackgrounds((prev) => {
        const newData = data.filter((item) => {
         if(item.user && item.user!==user.username) return false;
         return !prev.find((prevItem) => prevItem.id === item.id)
        }
        );
        newData.forEach((e) => {
          e.isDownloaded = false
          const imageUri = `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/backgroundImages/${e.image}`;
          e.image = imageUri;
        });
        return [...prev, ...newData];
      });
    }
  }

  const dbPromise = SQLite.openDatabaseAsync("background.db");

  async function createTable() {
    try {
      const db = await dbPromise;
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS backgroundImages (
          id INTEGER PRIMARY KEY, 
          image TEXT DEFAULT NULL, 
          sender TEXT DEFAULT NULL, 
          reciver TEXT DEFAULT NULL,
          isDownloaded BOOLEAN DEAFULT false
          );`
      );
      const data = await db.getAllAsync("SELECT * FROM backgroundImages");
      setBackgrounds(data);
    } catch (error) {
      console.log(error.message);
    }
  }

  // async function dropTable() {
  //   const db = await dbPromise;
  //   await db.execAsync("DROP TABLE IF EXISTS backgroundImages");
  // }

  useEffect(() => {
    createTable();
  }, []);

  useEffect(() => {
    fetchBackgrounds();
  }, [isConnected,user]);


  async function downloadBackground(image){
    if(!isConnected || image.isDownloaded) return;
    const db = await dbPromise;
    const uri = image.image;
    const filename = uri.split("/").pop();
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    const downloadFile = await FileSystem.downloadAsync(uri, fileUri);
    if (downloadFile.status === 200) {
      setBackgrounds((prev) => {
        const newBackgrounds = prev.map((e) => {
          if (e.id === image.id) {
            e.isDownloaded = true;
            e.image = fileUri;
          }
          return e;
        });
        return newBackgrounds;
      });
      await db.runAsync(
        `INSERT INTO backgroundImages (id, image, sender, reciver, isDownloaded) VALUES (?, ?, ?, ?, ?);`,
        [image.id, fileUri, image.sender, image.reciver, true]
      )
    }
  }

  async function setBackgroundImageForRoom(image,roomID){
    try{
    await AsyncStorage.setItem(`background_${roomID}`, JSON.stringify(image));
    return image;
    }catch(error){
      return null;
    }
  }


  async function deleteBackgroundImage(image){
    const db = await dbPromise;
    await db.runAsync("DELETE FROM backgroundImages WHERE id = ?", [image.id]);
    await FileSystem.deleteAsync(image.image);
    setBackgrounds((prev) => prev.filter((e) => e.id !== image.id));
  }




  const value = useMemo(
    () => ({
      backgrounds,
      downloadBackground,
      setBackgroundImageForRoom,
      deleteBackgroundImage
    }),
    [backgrounds]
  );

  return (
    <backgroundContext.Provider value={value}>
      {children}
    </backgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(backgroundContext);
}
