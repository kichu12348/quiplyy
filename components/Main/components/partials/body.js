import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { TextInput } from "react-native-gesture-handler";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSql } from "../../../../contexts/sqlContext";
import { useAuth } from "../../../../contexts/authContext";
import axios from "axios";
import { useSocket } from "../../../../contexts/socketContext";

const Body = ({ moveTo }) => {
  const theme = useTheme();
  
  const { width } = Dimensions.get("window");
  const { setSelectedContact } = useMessager();
  const sql = useSql();
  const auth = useAuth();
  const { socket,isConnected,endPoint} = useSocket();
  axios.defaults.baseURL = `${endPoint}/user`;
  const [contacts, setContacts] = useState(sql.contacts);
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const setMessager = (contact) => {
    setSelectedContact(contact);
    moveTo("SingleChat");
  };

  const queryUsers = async () => {
    if(!isConnected) return;
    if (query.length < 3) {
      setContacts(sql.contacts);
      return;
    }
    setIsQuerying(true);
    await axios.post("/queryUsers", { query, token:auth.token }).then((res) => {
      if (res.data.success) {
        setContacts(res.data.list.filter(e => auth.user?.username !== e?.username && e?.username.toLowerCase().includes(query.toLowerCase())));
      }
    }).catch((e) => {
      console.log("error:query " + e.message);
    });
  };

  const addContact = (id) => {
    if(!isConnected) return;
    if(id===auth.user.id) return;
    auth.addContact(id);
    setIsQuerying(false);
    setContacts(sql.contacts);
    setQuery("");
  };

  const renderList = ({index,item }) => {
    return (
      item &&  item.id ? (
        <TouchableOpacity
          style={styles.listItem(theme.theme)}
          onPress={() => {
            isQuerying ? addContact(item.id) : setMessager({ ...item })
          }}
          key={item.id}
        >
          <Image
            source={{
              uri: `https://api.multiavatar.com/${item.username}.png?apikey=CglVv3piOwAuoJ`,
            }}
            style={styles.Image}
          />
          <Text
            style={styles.textStyles(
              theme.theme === "dark" ? "white" : "black"
            )}
          >
            {item.username}
          </Text>
        </TouchableOpacity>
      ) : null
    );
  };

  useEffect(() => {
    sql.Contacts();
  }, []);

  useEffect(() => {
    setContacts(sql.contacts);
  }, [sql.contacts]);

  const handleAddContactSocket = useCallback((data) => {
    if(data.id===auth.user.id)return;
    sql.setContacts(prev => [...prev, {
      id: data.id,
      username: data.username,
      roomID: data.roomID,
    }]);
    setContacts(prev => [...prev, {
      id: data.id,
      username: data.username,
      roomID: data.roomID,
    }]);
    sql.AddContact({
      id: data.id,
      username: data.username,
      roomID: data.roomID,
      time: Date.now().toString(),
    })
  }, [socket]);

  useEffect(() => {
    socket?.on('addContact', handleAddContactSocket);
    return () => {
      socket?.off('addContact', handleAddContactSocket);
    };
  }, [socket, handleAddContactSocket]);

  return (
    <SafeAreaView
      style={styles.container(theme.theme === "dark" ? "black" : "white")}
    >
      <TextInput
        placeholder="search...🔍"
        placeholderTextColor={theme.theme === "dark" ? "white" : "black"}
        style={styles.TextInput(theme.theme)}
        value={query}
        onChangeText={(text) => setQuery(text)}
        onChange={() => queryUsers()}
        readOnly={!isConnected||!socket}
      />
      <View style={styles.flatListContainer(width)}>
        <FlatList
          renderItem={renderList}
          data={contacts}
          keyExtractor={item => item.id}
        />
      </View>
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
    width: "90%",
    backgroundColor: color === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)",
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
  Image: {
    height: 50,
    width: 50,
  },
});
