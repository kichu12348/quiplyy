import * as SQLite from "expo-sqlite";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./authContext";
import { useSocket } from "./socketContext";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
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
        isGroup: auth.contacts.isGroup,
        noOfMembers:auth.contacts.noOfMenbers
      });
      setContacts(prev=>[...prev,{
        id: auth.contacts.id,
        username: auth.contacts.username,
        roomID: auth.contacts.roomID,
        time: auth.contacts.time,
        isGroup: auth.contacts.isGroup,
        noOfMembers:auth.contacts.noOfMenbers
      }])
    }
  }, [auth.contacts]);


  const getContacts = async () => {
    const c = await auth.getContacts();
    if (!c || c?.length===contacts?.length) return;
    c?.map(async (contact) => {
      const newContact ={
        id: contact.contact._id,
        username: contact.contact.username,
        time: contact.contact.updatedAt,
        roomID: contact.roomID,
        isGroup: contact.contact.isGroup,
        noOfMembers:contact.contact.noOfMembers
      }
      if(contacts.find(e=>e.id===newContact.id && e.noOfMembers>newContact.noOfMembers)){
        updateContact(newContact);
        return;
      }
      if(contacts.find(e=>e.id===newContact.id)) return;
      await AddContact(newContact);
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
                isGroup BOOLEAN DEFAULT false,
                noOfMembers INTEGER DEFAULT 0,
                time TEXT
            );
        `);

    const rows = await db.getAllAsync("SELECT * FROM contacts");
    if(contacts?.length===rows?.length) return;
    setContacts(rows);
  }

  async function updateContact(contact) {
    const { id, username, time, roomID,isGroup,noOfMembers } = contact;
    const db = await SQLite.openDatabaseAsync("contacts.db");
    await db.runAsync(
      `UPDATE contacts SET username = ?, time = ?, roomID = ?, isGroup = ?, noOfMembers = ? WHERE id = ?`,
      [username, time, roomID,isGroup,noOfMembers, id]
    );
    Contacts();
  }

  async function dropContactsDB() {
    const db = await SQLite.openDatabaseAsync("contacts.db");
    await db.execAsync(`DROP TABLE IF EXISTS contacts;`);
    setContacts(null)
  }


  async function AddContact(contact) {
    
    try {
      const { id, username, time, roomID,isGroup,noOfMembers} = contact;
      const db = await SQLite.openDatabaseAsync("contacts.db");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS contacts (
                id TEXT,
                username TEXT,
                roomID TEXT,
                isGroup BOOLEAN DEFAULT false,
                noOfMembers INTEGER DEFAULT 0,
                time TEXT
            );
        `)
      const checkUser = await db.getFirstAsync(
        `SELECT * FROM contacts WHERE username = ?`,
        [username]
      );
      if (checkUser) return false;
      await db.runAsync(
        `INSERT INTO contacts (id, username, time,roomID,isGroup,noOfMembers) VALUES (?, ?, ?,?,?,?)`,
        [id, username, time, roomID,isGroup,noOfMembers]
      );
      return true;
    } catch (e) {
      console.log("sql add error: "+e.message);
      return false;
    }
  }

  const value = useMemo(() => {
    return {
      contacts,
      Contacts,
      AddContact,
      dropContactsDB,
      setContacts,
      updateContact,
      getContacts,
    };
  }, [contacts]);

  return <sqlContext.Provider value={value}>{children}</sqlContext.Provider>;
}

function useSql() {
  const context = useContext(sqlContext);
  return context;
}

export { SqlProvider, useSql };
