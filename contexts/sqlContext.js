import * as SQLite from "expo-sqlite";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./authContext";
import { useSocket } from "./socketContext";
const sqlContext = createContext();

function SqlProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const auth = useAuth();
  const{socket,isConnected}=useSocket()

  useEffect(() => {
    if (auth.contacts) {
      AddContact({
        id: auth.contacts.id,
        username: auth.contacts.username,
        roomID: auth.contacts.roomID,
        time: auth.contacts.time,
      });
      setContacts(prev=>[...prev,{
        id: auth.contacts.id,
        username: auth.contacts.username,
        roomID: auth.contacts.roomID,
        time: auth.contacts.time,
      }])
    }
  }, [auth.contacts]);

  const getContacts = async () => {
    const c = await auth.getContacts();
    
    if (!c || c?.length===contacts?.length) return;
    c?.map(async (contact) => {
      await AddContact({
        id: contact.contact._id,
        username: contact.contact.username,
        time: contact.contact.updatedAt,
        roomID: contact.roomID,
      });
      Contacts();
    });
    
  };

  useEffect(() => {
    getContacts();
  }, [auth.token,socket,isConnected]);

  async function Contacts() {
    const db = await SQLite.openDatabaseAsync("contacts.db");
    await db.execAsync(`
            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT,
                username TEXT,
                roomID TEXT,
                time TEXT
            );
        `);

    const rows = await db.getAllAsync("SELECT * FROM contacts");
    setContacts(rows);
  }

  async function dropContactsDB() {
    const db = await SQLite.openDatabaseAsync("contacts.db");
    await db.execAsync(`DROP TABLE IF EXISTS contacts;`);
    setContacts(null)
  }


  async function AddContact(contact) {
    
    try {
      const { id, username, time, roomID } = contact;
      const db = await SQLite.openDatabaseAsync("contacts.db");
      const checkUser = await db.getFirstAsync(
        `SELECT * FROM contacts WHERE username = ?`,
        [username]
      );
      if (checkUser) return false;
      await db.runAsync(
        `INSERT INTO contacts (id, username, time,roomID) VALUES (?, ?, ?,?)`,
        [id, username, time, roomID]
      );
      return true;
    } catch (e) {
      console.log(e.message);
      return false;
    }
  }

  const value = useMemo(() => {
    return {
      contacts,
      Contacts,
      AddContact,
      dropContactsDB,
      setContacts
    };
  }, [contacts]);

  return <sqlContext.Provider value={value}>{children}</sqlContext.Provider>;
}

function useSql() {
  const context = useContext(sqlContext);
  return context;
}

export { SqlProvider, useSql };
