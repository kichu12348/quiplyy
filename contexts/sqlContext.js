import * as SQLite from "expo-sqlite";
import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "./authContext";
import { useSocket } from "./socketContext";

const SqlContext = createContext();

function SqlProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const auth = useAuth();
  const { socket, isConnected } = useSocket();
  const contactIds = useRef(new Set());

  useEffect(() => {
    if (auth?.contacts) {
      const newContact = {
        id: auth?.contacts?.id,
        username: auth?.contacts.username,
        roomID: auth?.contacts.roomID,
        time: auth?.contacts.time,
        isGroup: auth?.contacts.isGroup,
        noOfMembers: auth?.contacts.noOfMembers
      };
      if(newContact.id === auth?.user?.id) return;
      AddContact(newContact);
    }
  }, [auth.contacts]);

  const getContacts = async () => {
    const c = await auth.getContacts();
    c?.forEach(async (contact) => {
      const newContact = {
        id: contact.contact._id,
        username: contact.contact.username,
        time: contact.contact.updatedAt,
        roomID: contact.roomID,
        isGroup: contact.contact.isGroup,
        noOfMembers: contact.contact.noOfMembers
      };
      
      if(newContact.id === auth?.user?.id) return;
      if (contacts?.length === 0 || !contacts) {
        await AddContact(newContact);
        return;
      }
      if (contacts.find(e => contactIds.current.has(newContact.id) && e.noOfMembers > newContact.noOfMembers)) {
        updateContact(newContact);
        return;
      }
      if (contactIds.current.has(newContact.id)) return;
      await AddContact(newContact);
    });
  };

  useEffect(() => {
    getContacts();
  }, [auth.token, socket, isConnected]);

  async function Contacts() {
    const db = await openDatabase();
    const rows = await db.getAllAsync("SELECT * FROM contacts");
    if (contacts?.length === rows?.length) return;
    contactIds.current.clear();
    rows.forEach((row) => {
      contactIds.current.add(row.id);
    });
    setContacts(rows);
  }

  async function updateContact(contact) {
    const { id, username, time, roomID, isGroup, noOfMembers } = contact;
    const db = await openDatabase();
    await db.runAsync(
      `UPDATE contacts SET username = ?, time = ?, roomID = ?, isGroup = ?, noOfMembers = ? WHERE id = ?`,
      [username, time, roomID, isGroup, noOfMembers, id]
    );
    await Contacts();
  }

  async function dropContactsDB() {
    const db = await openDatabase();
    await db.execAsync(`DROP TABLE IF EXISTS contacts;`);
    setContacts(null);
    contactIds.current.clear();
  }

  async function AddContact(contact) {
    if (contactIds.current.has(contact.id)) return;
    if(!contact) return;
    try {
      const { id, username, time, roomID, isGroup, noOfMembers } = contact;
      const db = await openDatabase();
      const checkUser = await db.getFirstAsync(
        `SELECT * FROM contacts WHERE username = ?`,
        [username]
      );
      if (checkUser) return false;
      await db.runAsync(
        `INSERT INTO contacts (id, username, time, roomID, isGroup, noOfMembers) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, username, time, roomID, isGroup, noOfMembers]
      );
      contactIds.current.add(id);
      await Contacts();
      return true;
    } catch (e) {
      console.log("sql add error: " + e.message);
      return false;
    }
  }

  async function openDatabase() {
    const db = await SQLite.openDatabaseAsync("contacts.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        username TEXT,
        roomID TEXT,
        isGroup BOOLEAN DEFAULT false,
        noOfMembers INTEGER DEFAULT 0,
        time TEXT
      );
    `);
    return db;
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

  return <SqlContext.Provider value={value}>{children}</SqlContext.Provider>;
}

function useSql() {
  const context = useContext(SqlContext);
  if (!context) {
    throw new Error("useSql must be used within a SqlProvider");
  }
  return context;
}

export { SqlProvider, useSql };