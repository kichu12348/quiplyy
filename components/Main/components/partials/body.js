import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useEffect, useState, useCallback, memo} from "react";
import { TextInput } from "react-native-gesture-handler";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSql } from "../../../../contexts/sqlContext";
import { useAuth } from "../../../../contexts/authContext";
import axios from "axios";
import { useSocket } from "../../../../contexts/socketContext";
import CreateGroupChat from "./createGroupChat";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import CustomModal from "./utils/customModal";

const Body = ({ moveTo }) => {
  const theme = useTheme();
  const { width } = Dimensions.get("window");
  const { setSelectedContact } = useMessager();
  const sql = useSql();
  const auth = useAuth();
  const { socket, isConnected, endPoint, supabase } = useSocket();
  axios.defaults.baseURL = `${endPoint}/user`;

  const [contacts, setContacts] = useState(sql.contacts);
  const [isStory, setIsStory] = useState(false);
  const [isStoryUri, setIsStoryUri] = useState(null);
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
    if (query.trim() === "") {
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
    return name.length > 20 ? name.slice(0, 20) + "..." : name;
  };

  const addContact = async (id) => {
    if (!isConnected) return;
    if (id === auth?.user?.id) return;
    const data = await auth.addContact(id);
    if (data) {
      setMessager(data);
    }
    setIsQuerying(false);
    setQuery("");
    setContacts(sql.contacts);
  };

  const getImage = async () => {
    try {
      const maxSize = 8 * 1024 * 1024;
      const { assets } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspects: [9, 16], //potrait
        quality: 0.5,
      });

      if (assets.canceled) return;
      const file = assets[0];
      if (file.mimeType === "image/gif") return;
      if (file.fileSize > maxSize) {
        Alert.alert("Error", "Image size should be less than 8MB");
        return null;
      }
      const uri = file.uri;
      
      const manipResult = await manipulateAsync(
        uri,
        [],
        { compress: 0.5, format: SaveFormat.JPEG }
      );
      
      if (file.fileSize > maxSize) {
        Alert.alert("Error", "Image size should be less than 8MB");
        return null;
      }
      const popedName=manipResult.uri.split("/").pop().split(".")[1];
      return { uri, popedName };
    } catch (error) {
      return null;
    }
  };

  const uploadStory = async () => {
    if (!isConnected) return;
    const uri = await getImage();
    if (!uri) return;
    const base64 = await FileSystem.readAsStringAsync(uri.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await supabase.storage
      .from("stories")
      .upload(`${auth.user?.id}.${uri.popedName}`, decode(base64), {
        contentType: `image/${uri.popedName}`,
        upsert: true,
      });
    if (error) return Alert.alert("Error", "Failed to upload story");
    const { error: err } = await supabase.from("story").upsert({
      id: auth.user?.id,
      storyUri: `${auth.user?.id}.${uri.popedName}`,
      username: auth.user?.username,
      time: new Date().getTime(),
    });
    if (error || err) return Alert.alert("Error", "Failed to upload story");
    auth.setStory(uri.uri);
  };

  const RenderList = memo(({ item }) => {
    const [storyUri, setStoryUri] = useState(null);

    async function getStory() {
      if (!isConnected) return;
      const { allStories } = auth;
      if (!allStories || allStories.length === 0) return;
      const story = allStories.find((e) => e.id === item.id);
      if (!story) return;
      setStoryUri(story.storyUri);
    }

    useEffect(() => {
      getStory();
    }, []);

    const openStory = () => {
      if (!storyUri) return;
      setIsStory(true);
      setIsStoryUri(
        `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/stories/${storyUri}`
      );
    };

    return item && item.id ? (
      <TouchableOpacity
        style={styles.listItem(theme)}
        onPress={() => {
          isQuerying ? addContact(item.id) : setMessager({ ...item });
        }}
        key={item.id}
      >
        {!item.isGroup ? (
          <TouchableOpacity
            style={styles.centerDiv}
            disabled={!isConnected || !storyUri}
            onPress={openStory}
          >
            <LinearGradient
              colors={
                storyUri
                  ? [
                      "#FF8C00" /* Dark Orange */,
                      "#FFB600" /* Bright Yellow */,
                      "#FF5733" /* Fiery Red-Orange */,
                      "#C70039" /* Dark Red */,
                      "#900C3F" /* Deep Magenta */,
                      "#581845" /* Dark Purple */,
                    ]
                  : ["transparent", "transparent"]
              }
              style={styles.circle(55, "transparent", storyUri)}
            >
              <View style={styles.circle(50, theme.background)}>
                <Image
                  source={{
                    uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${item.username.trim()}.jpg`,
                  }}
                  style={styles.Image(0, 50)}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Image source={theme.Icons.group} style={styles.Image(0, 50)} />
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
      if (!sql.contacts) return sql.getContacts();
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
            onChangeText={(text) => {
              if (!isConnected) return;
              if (query.trim() === "" || query.length < 3)
                setContacts(sql.contacts);
              setQuery(text);
              queryUsers();
            }}
            readOnly={!isConnected || !socket}
          />
          {query.trim() === "" && (
            <>

              <TouchableOpacity
                style={styles.centerDivSpace(10)}
                disabled={!isConnected}
                onPress={uploadStory}
              >
                <Image source={theme.Icons.story} style={styles.Image(0, 35)} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.centerDivSpace(10)}
                disabled={!isConnected}
                onPress={()=>{
                  moveTo("AiChat")
                }}
              >
                <Image source={theme.Icons.ai} style={styles.Image(0, 35)} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.Image(10)}
                disabled={!isConnected || !socket}
                onPress={openGpChat}
              >
                <Image source={theme.Icons.add} style={styles.Image()} />
              </TouchableOpacity>
            </>
          )}
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
      <CustomModal
        visible={isStory}
        onRequestClose={() => setIsStory(false)}
        ImageUri={isStoryUri}
      />
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
    flex: 1,
    padding: 10,
    color: color === "dark" ? "white" : "black",
    fontWeight: "bold",
  }),
  listItem: (theme) => ({
    padding: 10,
    backgroundColor: theme.theme === "dark" ? "#212121" : "#e0e0e0",
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
  }),
  textStyles: (color) => ({
    color: color,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 30,
  }),
  Image: (mr = 0, s = 40) => ({
    height: s,
    width: s,
    borderRadius: 25,
    alignSelf: "center",
    marginRight: mr,
  }),
  textInputContainer: (theme) => ({
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  }),
  TextInp: (theme) => ({
    height: "100%",
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: theme.textInputColor.color,
    borderRadius: 30,
  }),
  circle: (r, c = "transparent") => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c,
  }),
  centerDiv: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerDivSpace: (space) => ({
    justifyContent: "center",
    alignItems: "center",
    marginRight: space,
  }),
});
