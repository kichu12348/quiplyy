import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useEffect, useState, useCallback, memo } from "react";
import { TextInput } from "react-native-gesture-handler";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSql } from "../../../../contexts/sqlContext";
import { useAuth } from "../../../../contexts/authContext";
import axios from "axios";
import { useSocket } from "../../../../contexts/socketContext";
import CreateGroupChat from "./createGroupChat";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import CustomModal from "./utils/customModal";
import { useMusic } from "../../../../contexts/musicContext";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import RenderList from "./chatComps/contactsRenderList";

const Body = ({ moveTo }) => {
  const theme = useTheme();
  const { width } = Dimensions.get("window");
  const { setSelectedContact } = useMessager();
  const sql = useSql();
  const auth = useAuth();
  const { socket, isConnected, endPoint, supabase } = useSocket();
  const { pauseSound, current, isPlaying } = useMusic();

  axios.defaults.baseURL = `${endPoint}/user`;
  //animated music top bar

  const topBar = useSharedValue(0);
  const topBarStyle = useAnimatedStyle(() => {
    return {
      height: topBar.value,
    };
  });

  const openTopBar = () => {
    if (!isPlaying) {
      if (topBar.value === 0) return;
      topBar.value = withTiming(0, {
        duration: 300,
        easing: Easing.in,
      });
    } else if (isPlaying) {
      topBar.value = 75;
    }
  };

  useEffect(() => {
    openTopBar();
  }, [isPlaying]);

  const closeTopBar = async () => {
    if (topBar.value === 0 || !isPlaying) return;
    topBar.value = withTiming(0, {
      duration: 300,
      easing: Easing.in,
    });
    pauseSound();
  };

  ////////////////////////////

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

  const addContact = async (id) => {
    if (!isConnected) return;
    if (id === auth?.user?.id) return;
    const check = sql.contacts.find((e) => e.id === id);
    if (check) {
      setMessager(check);
      setIsQuerying(false);
      setQuery("");
      setContacts(sql.contacts);
      return;
    }
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

      const manipResult = await manipulateAsync(uri, [], {
        compress: 0.5,
        format: SaveFormat.JPEG,
      });

      if (file.fileSize > maxSize) {
        Alert.alert("Error", "Image size should be less than 8MB");
        return null;
      }
      const popedName = manipResult.uri.split("/").pop().split(".")[1];
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
    const { error } = await supabase.storage
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
      <Animated.View style={[styles.topBar, topBarStyle]}>
        {isPlaying && (
          <TouchableOpacity
            style={styles.topBarBox(theme)}
            onPress={() => moveTo("Stuff")}
          >
            <Image style={styles.musicImage} source={{ uri: current?.image }} />
            <TouchableOpacity
              style={styles.playPause}
              onPress={() => {
                closeTopBar();
              }}
            >
              <Image style={styles.playPause} source={theme.Icons.pause} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Animated.View>
      <View style={styles.textInputContainer(theme)}>
        <View style={styles.TextInp(theme)}>
          <TextInput
            placeholder="search......"
            placeholderTextColor={theme.theme === "dark" ? "white" : "black"}
            style={styles.TextInput(theme.theme)}
            value={query}
            onChangeText={(text) => {
              if (!isConnected) return;
              if (query.length < 3) setContacts(sql.contacts);
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
                onPress={() => {
                  moveTo("AiChat");
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
          renderItem={({ item }) => (
            <RenderList
              item={item}
              isQuerying={isQuerying}
              addContact={addContact}
              setMessager={setMessager}
              setIsStory={setIsStory}
              setIsStoryUri={setIsStoryUri}
            />
          )}
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
    backgroundColor: theme.theme === "dark" ? "rgba(30,30,30,0.8)" : "#e0e0e0",
    borderRadius: 30,
  }),
  centerDivSpace: (space) => ({
    justifyContent: "center",
    alignItems: "center",
    marginRight: space,
  }),
  topBar: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarBox: (theme) => ({
    width: "95%",
    height: "85%",
    backgroundColor: theme.theme === "dark" ? "#212121" : "#e0e0e0",
    borderRadius: 25,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 15,
  }),
  musicImage: {
    height: 40,
    width: 40,
    borderRadius: 10,
  },
  playPause: {
    height: 30,
    width: 30,
    borderRadius: 10,
  },
});
