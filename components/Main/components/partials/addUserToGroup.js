import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useSql } from "../../../../contexts/sqlContext";
import { useSocket } from "../../../../contexts/socketContext";
import axios from "axios";
import { useAuth } from "../../../../contexts/authContext";
import { useMessager } from "../../../../contexts/messagerContext";

const AddUserToGroup = ({ setIsAddUser }) => {
  const { theme, Icons } = useTheme();
  const { updateContact, contacts } = useSql();
  const { socket, isConnected, endPoint } = useSocket();
  const { token } = useAuth();
  const { selectedContact, setSelectedContact } = useMessager();

  axios.defaults.baseURL = `${endPoint}/user`;

  //states
  const [selectedContacts, setSelectedContacts] = useState([]);

  const createGroupChat = async () => {
    try {
      if (!isConnected || !socket) return;
      if (selectedContacts.length === 0) return setIsAddUser(false);

      await axios
        .post("/addUsersToGroup", {
          token,
          users: selectedContacts,
          groupId: selectedContact.id,
        })
        .then((res) => {
          if (res.data.success) {
            const updatedContact = {
              id: selectedContact.id,
              username: selectedContact.username,
              isGroup: true,
              noOfMembers: res.data.members,
              roomID: selectedContact.roomID,
              time: selectedContact.time,
            };
            setSelectedContact(updatedContact);
            updateContact(updatedContact);

            socket.emit("updateContact", {
              updateContact: updatedContact,
              contacts: selectedContacts,
            });

            setIsAddUser(false);
            return;
          }
          setIsAddUser(false);
        })
        .catch((err) => {
          Alert.alert("Error", err.message);
        });
    } catch (err) {
      console.log("adding users to gp err:" + err.message);
    }
  };

  const renderList = ({ item }) => {
    return item && item.id && !item.isGroup ? (
      <TouchableOpacity
        style={styles.listItem(theme, selectedContacts.includes(item.id))}
        key={item.id}
        onPress={() => addToSelectedContacts(item.id)}
      >
        <Image
          source={{
            uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${item.username.trim()}.png`,
          }}
          style={styles.Image()}
        />
        <Text style={styles.text(theme)}>{item.username}</Text>
        <View style={styles.tickContainer}>
          {selectedContacts.includes(item.id) ? (
            <Image source={Icons.tick} style={styles.Image(30)} />
          ) : null}
        </View>
      </TouchableOpacity>
    ) : null;
  };

  const addToSelectedContacts = (id) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter((contact) => contact !== id));
      return;
    }
    setSelectedContacts([...selectedContacts, id]);
  };

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsAddUser(false)}>
          <Image source={Icons.return} style={styles.Image(50)} />
        </TouchableOpacity>
        <Text style={styles.text(theme)}>Add Users</Text>
      </View>
      <View style={styles.flatListContainer("100%")}>
        <FlatList
          renderItem={renderList}
          data={contacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            disabled={!isConnected || !socket}
            onPress={createGroupChat}
          >
            <Text style={styles.text()}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddUserToGroup;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme === "dark" ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)",
  }),
  text: (theme = "dark") => ({
    fontSize: 20,
    fontWeight: "bold",
    color: theme === "dark" ? "white" : "black",
  }),
  Image: (size = 50) => ({
    width: size,
    height: size,
    marginRight: 10,
    borderRadius: size / 2,
  }),
  header: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
  },
  listItem: (theme) => ({
    padding: 20,
    backgroundColor: theme === "dark" ? "#212121" : "#e0e0e0",
    margin: 5,
    marginLeft: 10,
    width: "95%",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 25,
  }),
  flatListContainer: (width = "100%") => ({
    flex: 1,
    width: width,
    flexDirection: "column",
    justifyContent: "flex-start",
  }),
  tickContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  TextInput: (color = "dark") => ({
    height: 50,
    width: "90%",
    backgroundColor:
      color === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)",
    borderRadius: 25,
    padding: 10,
    margin: 10,
    marginTop: 20,
    color: color === "dark" ? "white" : "black",
    fontWeight: "bold",
  }),
  footer: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    height: 50,
    width: 150,
    backgroundColor: "rgba(0,0,255,0.8)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
