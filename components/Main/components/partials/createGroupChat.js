import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useSql } from "../../../../contexts/sqlContext";
import { useSocket } from "../../../../contexts/socketContext";
import { GoTrueClient } from "@supabase/supabase-js";
import axios from "axios";
import { useAuth } from "../../../../contexts/authContext";

const CreateGroupChat = ({ setIsGpChat }) => {
  const { theme, Icons } = useTheme();
  const { setContacts, AddContact, contacts } = useSql();
  const { socket, isConnected, endPoint } = useSocket();
  const { token } = useAuth();

  axios.defaults.baseURL = `${endPoint}/user`;

  //states
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");

  const createGroupChat = async () => {
    if (!isConnected || !socket) return;
    if (selectedContacts.length < 2) {
      Alert.alert("Select atleast 2 contacts");
      return;
    }
    if (!groupName) {
      Alert.alert("Enter group name");
      return;
    }
    if (groupName.length < 5) {
      Alert.alert("Group name should be atleast 5 characters");
      return;
    }
    await axios
      .post("/createGroup", {
        token,
        groupName,
        contacts: selectedContacts,
      })
      .then((res) => {
        if (res.data.success) {
          AddContact({
            id: res.data.contact.id,
            username: res.data.contact.username,
            roomID: res.data.contact.roomID,
            time: res.data.contact.time,
            isGroup: res.data.contact.isGroup,
            noOfMembers: res.data.contact.noOfMembers,
          });
          setContacts((prev) => [
            ...prev,
            {
              id: res.data.contact.id,
              username: res.data.contact.username,
              roomID: res.data.contact.roomID,
              time: res.data.contact.time,
              isGroup: res.data.contact.isGroup,
              noOfMembers: res.data.contact.noOfMembers,
            },
          ]);
          setGroupName("");
          setSelectedContacts([]);
          setIsGpChat(false);
          socket.emit("groupChatCreated", {
            contacts: selectedContacts,
            data:{
              id: res.data.contact.id,
              username: res.data.contact.username,
              roomID: res.data.contact.roomID,
              time: res.data.contact.time,
              isGroup: res.data.contact.isGroup,
              noOfMembers: res.data.contact.noOfMembers,
            }
          });
          return;
        }
        if (!res.data.success) {
          Alert.alert(res.data.error);
          return;
        }
      });
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
            uri: `https://api.multiavatar.com/${item.username}.png?apikey=CglVv3piOwAuoJ`,
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
        <TouchableOpacity onPress={() => setIsGpChat(false)}>
          <Image source={Icons.return} style={styles.Image(50)} />
        </TouchableOpacity>
        <Text style={styles.text(theme)}>CreateGroupChat</Text>
      </View>
      <View style={styles.flatListContainer("100%")}>
        <TextInput
          placeholder="Group Name...."
          placeholderTextColor={theme === "dark" ? "white" : "black"}
          style={styles.TextInput(theme)}
          readOnly={!isConnected || !socket}
          value={groupName}
          onChangeText={(text) => setGroupName(text)}
        />
        <FlatList
          renderItem={renderList}
          data={contacts}
          keyExtractor={(item) => item.id}
        />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            disabled={!isConnected || !socket}
            onPress={createGroupChat}
          >
            <Text style={styles.text()}>create</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreateGroupChat;

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
  }),
  header: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
  },
  listItem: (color) => ({
    padding: 20,
    backgroundColor: "transparent",
    margin: 0,
    width: "90%",
    alignItems: "center",
    flexDirection: "row",
    borderColor: color === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    borderBottomWidth: 0.5,
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
