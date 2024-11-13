import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useSql } from "../../../../contexts/sqlContext";
import { useSocket } from "../../../../contexts/socketContext";
import axios from "axios";
import { useAuth } from "../../../../contexts/authContext";
import Icon from "./utils/icons";

const CreateGroupChat = ({ setIsGpChat }) => {
  const { theme, Icons, textInputColor, background } = useTheme();
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
            data: {
              id: res.data.contact.id,
              username: res.data.contact.username,
              roomID: res.data.contact.roomID,
              time: res.data.contact.time,
              isGroup: res.data.contact.isGroup,
              noOfMembers: res.data.contact.noOfMembers,
            },
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
            uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${item.username.trim()}.jpg`,
          }}
          style={styles.Image()}
        />
        <Text style={styles.text(theme)}>{item.username}</Text>
        <View style={styles.tickContainer}>
          {selectedContacts.includes(item.id) ? (
            <Icon name="Check" size={30}  style={{alignSelf:"flex-end"}}/>
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
    <SafeAreaView>
      <View style={styles.container(background)}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsGpChat(false)}>
            <Icon 
            name="ChevronLeft" 
            size={40}
            style={{marginLeft:10,alignSelf:"center"}}
             />
          </TouchableOpacity>
          <Text style={styles.text(theme)}>CreateGroupChat</Text>
        </View>
        <View style={styles.flatListContainer("100%")}>
          <View style={styles.textInpContainer}>
            <TextInput
              placeholder="Group Name...."
              placeholderTextColor={theme === "dark" ? "white" : "black"}
              style={styles.TextInput(textInputColor, theme)}
              readOnly={!isConnected || !socket}
              value={groupName}
              onChangeText={(text) => setGroupName(text)}
            />
          </View>
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
              <Text style={styles.text()}>create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreateGroupChat;

const styles = StyleSheet.create({
  container: (backgroundColor) => ({
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: backgroundColor,
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
  TextInput: (textInputColor, theme) => ({
    height: 50,
    width: "90%",
    backgroundColor: textInputColor.color,
    borderRadius: 25,
    padding: 10,
    margin: 10,
    marginTop: 20,
    color: theme === "dark" ? "white" : "black",
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
  textInpContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
});
