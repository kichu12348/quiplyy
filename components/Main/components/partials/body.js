import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { TextInput } from "react-native-gesture-handler";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSql } from "../../../../contexts/sqlContext";
import { useAuth } from "../../../../contexts/authContext";
import axios from "axios";
import { useSocket } from "../../../../contexts/socketContext";
import CreateGroupChat from "./createGroupChat";

const Body = ({ moveTo }) => {
  const theme = useTheme();

  const { width } = Dimensions.get("window");
  const { setSelectedContact } = useMessager();
  const sql = useSql();
  const auth = useAuth();
  const { socket, isConnected, endPoint } = useSocket();
  axios.defaults.baseURL = `${endPoint}/user`;

  const [contacts, setContacts] = useState(sql.contacts);
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [isGpChat, setIsGpChat] = useState(false);

  const openGpChat = () => {
    setIsGpChat(true);
    setQuery("");
    setIsQuerying(false);
    setContacts(sql.contacts);
  };

  const setMessager = (contact) => {
    setSelectedContact(contact);
    moveTo("SingleChat");
  };

  const queryUsers = async () => {
    if (!isConnected) return;
    if (query.length < 3) {
      setContacts(sql.contacts);
      return;
    }
    setIsQuerying(true);
    await axios
      .post("/queryUsers", { query, token: auth.token })
      .then((res) => {
        if (res.data.success) {
          setContacts(
            res.data.list.filter(
              (e) =>
                auth.user?.username !== e?.username &&
                e?.username.toLowerCase().includes(query.toLowerCase())
            )
          );
        }
      })
      .catch((e) => {
        console.log("error:query " + e.message);
      });
  };

  const addContact = (id) => {
    if (!isConnected) return;
    if (id === auth.user.id) return;
    auth.addContact(id);
    setIsQuerying(false);
    setContacts(sql.contacts);
    setQuery("");
  };

  const renderList = ({ item }) => {
    return item && item.id ? (
      <TouchableOpacity
        style={styles.listItem(theme.theme)}
        onPress={() => {
          isQuerying ? addContact(item.id) : setMessager({ ...item });
        }}
        key={item.id}
      >
        {!item.isGroup ? (
          <Image
            source={{
              uri: `https://api.multiavatar.com/${item.username}.png?apikey=CglVv3piOwAuoJ`,
            }}
            style={styles.Image()}
          />
        ) : (
          <Image source={theme.Icons.group} style={styles.Image()} />
        )}

        <Text
          style={styles.textStyles(theme.theme === "dark" ? "white" : "black")}
        >
          {item.username}
        </Text>
      </TouchableOpacity>
    ) : null;
  };

  useEffect(() => {
    sql.Contacts();
  }, []);

  useEffect(() => {
    setContacts(sql.contacts);
  }, [sql.contacts]);

  const handleAddContactSocket = useCallback(
    (data) => {
      if (data.id === auth.user.id) return;
      if (sql.contacts.find((e) => e && e?.id === data.id)) return;
      sql.setContacts((prev) => [
        ...prev,
        {
          id: data.id,
          username: data.username,
          roomID: data.roomID,
          isGroup: data.isGroup,
          noOfMembers: data.noOfMembers,
        },
      ]);
      setContacts((prev) => [
        ...prev,
        {
          id: data.id,
          username: data.username,
          roomID: data.roomID,
          isGroup: data.isGroup,
          noOfMembers: data.noOfMembers,
        },
      ]);
      sql.AddContact({
        id: data.id,
        username: data.username,
        roomID: data.roomID,
        time: Date.now().toString(),
        isGroup: data.isGroup,
        noOfMembers: data.noOfMembers,
      });
    },
    [socket]
  );

  useEffect(() => {
    socket?.on("addContact", handleAddContactSocket);
    socket?.on("groupCreated", handleAddContactSocket);
    return () => {
      socket?.off("addContact", handleAddContactSocket);
    };
  }, [socket, handleAddContactSocket]);

  return (
    <SafeAreaView
      style={styles.container(theme.theme === "dark" ? "black" : "white")}
    >
      <View style={styles.textInputContainer}>
        <TextInput
          placeholder="search...🔍"
          placeholderTextColor={theme.theme === "dark" ? "white" : "black"}
          style={styles.TextInput(theme.theme)}
          value={query}
          onChangeText={(text) => setQuery(text)}
          onChange={() => queryUsers()}
          readOnly={!isConnected || !socket}
        />
        <TouchableOpacity
          style={styles.Image(10)}
          disabled={!isConnected || !socket}
          onPress={openGpChat}
        >
          <Image source={theme.Icons.add} style={styles.Image()} />
        </TouchableOpacity>
      </View>
      <View style={styles.flatListContainer(width)}>
        <FlatList
          renderItem={renderList}
          data={contacts}
          keyExtractor={(item) => item.id}
        />
      </View>
      <Modal
        visible={isGpChat}
        animationType="slide"
        hardwareAccelerated={true}
        transparent={true}
      >
        <CreateGroupChat setIsGpChat={setIsGpChat} />
      </Modal>
    </SafeAreaView>
  );
};

export default Body;

const styles = StyleSheet.create({
  container: (bg) => ({
    flex: 1,
    padding: 10,
    alignItems: "center",
    backgroundColor: bg,
  }),
  TextInput: (color) => ({
    height: 50,
    width: "80%",
    backgroundColor:
      color === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)",
    borderRadius: 25,
    padding: 10,
    margin: 10,
    marginTop: 20,
    color: color === "dark" ? "white" : "black",
    fontWeight: "bold",
  }),
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
  }),
  textStyles: (color) => ({
    color: color,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 30,
  }),
  Image: (mt = 0, ml = 0) => ({
    height: 50,
    width: 50,
    marginTop: mt,
    marginLeft: ml,
  }),
  textInputContainer: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
