import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useEffect, useState, useCallback,memo,useMemo } from "react";
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
  const [contactImageUris, setContactImageUris] = useState({});

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

  const getUriFromMap = useCallback((item) => {
    return contactImageUris[item.id] || `https://api.multiavatar.com/${item.username}.png?apikey=CglVv3piOwAuoJ`;
  }, [contactImageUris]);

  const getContactImageUri = useCallback(async (contacts) => {
    const newUris = {};
    for (const contact of contacts) {
      if (contact.isGroup) {
        newUris[contact.id] = theme.Icons.group;
      } else {
        const uri = await auth.getProfilePicture(contact.username);
        newUris[contact.id] = uri || `https://api.multiavatar.com/${contact.username}.png?apikey=CglVv3piOwAuoJ`;
      }
    }
    setContactImageUris(prevUris => ({...prevUris, ...newUris}));
  }, [auth, theme.Icons.group]);

  useEffect(() => {
    getContactImageUri(contacts);
  }, [contacts, getContactImageUri]);


  const queryUsers = async () => {
    if (!isConnected) return;
    if(query.trim() === "") {
      setContacts(sql.contacts);
      setIsQuerying(false);
      return;
    }
    if (query.length < 3) {
      setContacts(sql.contacts);
      setIsQuerying(false);
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

  const shortenName = (name) => {
    return name.length > 20 ? name.slice(0, 20) + "..." : name
  }

  const addContact =async (id) => {
    if (!isConnected) return;
    if (id === auth?.user?.id) return;
    const data=await auth.addContact(id);
    if(data){
      setMessager(data);
    }
    setIsQuerying(false);
    setQuery("");
    setContacts(sql.contacts);
  };

  const RenderList = memo(({ item }) => {
    const imageUri = useMemo(() => getUriFromMap(item), [item, getUriFromMap]);
    return item && item.id ? (
      <TouchableOpacity
        style={styles.listItem(theme)}
        onPress={() => {
          isQuerying ? addContact(item.id) : setMessager({ ...item });
        }}
        key={item.id}
      >
        {!item.isGroup ? (
          <Image
            source={{
              uri: imageUri,
            }}
            style={styles.Image()}
          />
        ) : (
          <Image source={theme.Icons.group} style={styles.Image()} />
        )}

        <Text
          style={styles.textStyles(theme.theme === "dark" ? "white" : "black")}
        >
          {shortenName(item.username)}
        </Text>
      </TouchableOpacity>
    ) : null;
  });

  useEffect(() => {
    sql.Contacts();
  }, []);

  useEffect(() => {
    setContacts(sql.contacts);
  }, [sql.contacts]);

  const handleAddContactSocket = useCallback(
    (data) => {
      
      if (data.id === auth?.user?.id) return;
      if(!sql.contacts) return sql.getContacts();
      if (sql.contacts?.find((e) => e && e?.id === data.id)) return;
      sql.getContacts();
    },
    [socket]
  );

  const handleUpdateContactSocket = useCallback(
    (data) => {
      sql.updateContact(data);
      setContacts(sql.contacts);
    },
    [socket]
  );

  useEffect(() => {
    socket?.on("addContact", handleAddContactSocket);
    socket?.on("groupCreated", handleAddContactSocket);
    socket?.on("updateContacT", handleUpdateContactSocket);
    return () => {
      socket?.off("addContact", handleAddContactSocket);
    };
  }, [socket, handleAddContactSocket]);

  return (
    <SafeAreaView>
      <View style={styles.textInputContainer(theme)}>
        <View style={styles.TextInp(theme)}>
          <TextInput
          placeholder="search......"
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
      </View>
      <View style={styles.flatListContainer(width)}>
        <FlatList
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RenderList item={item} />}
          data={contacts}
          keyExtractor={(item) => item.id}
        />
      </View>
      <Modal
        visible={isGpChat}
        animationType="slide"
        hardwareAccelerated={true}
        transparent={true}
        onRequestClose={() => setIsGpChat(false)}
      >
        <CreateGroupChat setIsGpChat={setIsGpChat} />
      </Modal>
    </SafeAreaView>
  );
};

export default Body;

const styles = StyleSheet.create({
  container: (bg, pdTop = 0) => ({
    flex: 1,
    padding: 0,
    alignItems: "center",
    backgroundColor: bg,
    paddingTop: pdTop,
  }),
  TextInput: (color) => ({
    height: 50,
    width: "80%",
    padding: 10,
    color: color === "dark" ? "white" : "black",
    fontWeight: "bold",
  }),
  listItem: (theme) => ({
    padding: 20,
    backgroundColor: theme.theme==="dark"?"#212121":"#e0e0e0", 
    margin:5,
    marginLeft: 10,
    width: "95%",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 25,
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
  Image: () => ({
    height: 40,
    width: 40,
    borderRadius: 25,
    alignSelf: "center",
  }),
  textInputContainer:(theme)=>({
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  }),
  TextInp:(theme)=>({
    height: "100%",
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: theme.textInputColor.color,
    borderRadius: 30,
  })
});
