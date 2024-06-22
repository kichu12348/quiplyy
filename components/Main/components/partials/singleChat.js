import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSocket } from "../../../../contexts/socketContext";
import { useAuth } from "../../../../contexts/authContext";

const SingleChat = ({ navigation }) => {
  const { theme, Icons,chatColor} = useTheme();
  const { selectedContact, randomUID } = useMessager();
  const { socket, isConnected, isLoading } = useSocket();
  const { user } = useAuth();

  axios.defaults.baseURL = "https://quiplyserver.onrender.com/message";

  //stickers

  const stickerPaths = {
    bonjour: require("./stickers/bonjour.jpeg"),
    mogCat: require("./stickers/mogCat.gif"),
    fisiks: require("./stickers/fisiks.jpeg"),
    ionGetIt: require("./stickers/ionGetIt.jpeg"),
    smileCat: require("./stickers/smileCat.gif"),
    stopThinking: require("./stickers/stopThinking.jpeg"),
    think: require("./stickers/think.jpeg"),
    tricks: require("./stickers/tricks.jpeg"),
  }
  //////////

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSticker, setIsSticker] = useState(false);
  const receivedMessageIds = useRef(new Set());

  const dbPromise = SQLite.openDatabaseAsync("messages.db");

  const createTableIfNotExists = async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        idx INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT,
        sender TEXT,
        msg TEXT,
        roomID TEXT,
        isSticker BOOLEAN DEFAULT 0,
        sticker TEXT DEFAULT NULL,
        time TEXT
      );
    `);
  };

  const loadMessages = async (db) => {
    const rows = await db.getAllAsync(
      "SELECT * FROM messages WHERE roomID = ?",
      [selectedContact.roomID]
    );
    setMessages(rows);
  };

  const initializeMessages = async () => {
    const db = await dbPromise;
    await createTableIfNotExists(db);
    await loadMessages(db);
  };

  const addMessageToDB = async (db, message) => {
    if(message.isSticker){
      await db.runAsync(
        "INSERT INTO messages (id, sender, msg, roomID, time, isSticker, sticker) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [message.id, message.sender, message.msg, message.roomID, message.time, message.isSticker, message.sticker]
      );
      return;
    }
    await db.runAsync(
      "INSERT INTO messages (id, sender, msg, roomID, time) VALUES (?, ?, ?, ?, ?)",
      [message.id, message.sender, message.msg, message.roomID, message.time]
    );
  };

  const handleIncomingMessage = useCallback(
    async (message) => {
      if (!isConnected || !selectedContact || message.sender === user.id)
        return;

      const db = await dbPromise;

      if (!receivedMessageIds.current.has(message.id)) {
        receivedMessageIds.current.add(message.id);
        await addMessageToDB(db, message);
        setMessages((prev) => [...prev, message]);
        await axios.post("/delete", { messageId: message.id });
      }
    },
    [isConnected, selectedContact, user.id]
  );

  function isOnlyEmojis(text) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const trimmedText = text.replace(/\s+/g, "");
    const emojiMatches = trimmedText.match(emojiRegex);
    return emojiMatches && emojiMatches.length === [...trimmedText].length;
  }

  const startChat = async () => {
    if (!isConnected || !selectedContact) return;

    socket.emit("joinRoom", { roomID: selectedContact.roomID });

    const db = await dbPromise;
    await createTableIfNotExists(db);

    const res = await axios.post("/check", { roomID: selectedContact.roomID });
    if (res.data.success) {
      for (const message of res.data.messages) {
        if (
          message.sender !== user.id &&
          !receivedMessageIds.current.has(message.id)
        ) {
          handleIncomingMessage(message);
        }
      }
      await loadMessages(db);
    } else {
      await loadMessages(db);
    }
  };

  useEffect(() => {
    startChat();
  }, [selectedContact, isConnected]);

  const sendSticker = async (sticker) => {
    if (!isConnected || !selectedContact) return;

    const message = {
      id: randomUID(),
      sender: user.id,
      msg: "",
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: true,
      sticker: sticker,
    };

    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, message]);
    socket.emit("message", { message });
    setIsSticker(false);
  }


  const sendMessage = async () => {
    if (!isConnected || msg.trim() === "") return;

    const message = {
      id: randomUID(),
      sender: user.id,
      msg: msg,
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
    };

    setMsg("");
    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, message]);
    socket.emit("message", { message });
  };

  useEffect(() => {
    if (socket) {
      socket.on("newMessage", handleIncomingMessage);
      return () => {
        socket.off("newMessage", handleIncomingMessage);
      };
    }
  }, [handleIncomingMessage]);

  const renderList = ({ item }) => {
    return (
      <View
        style={styles.flatListItem(
          item.sender === user.id ? "flex-end" : "flex-start"
        )}
        key={item?.id}
      >
        <View
          style={
            item.sender === user.id
              ? styles.messageLeft(item.isSticker?true:isOnlyEmojis(item.msg),chatColor)
              : styles.messageRight(item.isSticker?true:isOnlyEmojis(item.msg),chatColor)
          }
        >{item.isSticker?(
          <Image
            source={stickerPaths[item.sticker]}
            style={styles.Image(10, 10, 200, 200, 10)}
          />
        ):(
          <Text
            style={styles.textStyles(
              theme,
              isOnlyEmojis(item.msg) ? 60 : 15,
              400,
              "white"
            )}
          >
            {item.msg}
          </Text>
            )}
          
        </View>
      </View>
    );
  };

  StickerComponent = () => {
    return(
      <View style={styles.stickerModal}>
          <View style={styles.stickerContainer(theme)}>
            <View style={styles.stickerHeader}>
              <TouchableOpacity
                style={styles.Image(10, 20, 40, 40)}
                onPress={() => setIsSticker(false)}
              >
                <Image
                  source={Icons.return}
                  style={styles.Image(10, 20, 40, 40)}
                  onPress={() => setIsSticker(false)}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.stickers}>
              <ScrollView
                scrollEnabled={true}
                style={styles.ScrollView}
              >
                <View
                style={styles.rows}
                >
                  <StickerItem stickers={['bonjour','fisiks','ionGetIt']} />
                </View>
                <View
                style={styles.rows}
                >
                  <StickerItem stickers={['mogCat','smileCat','stopThinking']} />
                </View>
                <View
                style={styles.rows}
                >
                  <StickerItem stickers={['think','tricks']} />
                </View>
                
              </ScrollView>
            </View>
          </View>
        </View>
    )
  };

  const StickerItem = ({ stickers }) => {
    
   
    return (
      <>
        {stickers.map((sticker,index) => {
          return (
            <TouchableOpacity key={index}
              onPress={() => sendSticker(sticker)}
            >
              <Image
                source={stickerPaths[sticker]}
                style={styles.Image(10, 10, 100, 100, 20)}
              />
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header(theme)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.Image(10, 20)}
        >
          <Image source={Icons.return} style={styles.Image()} />
        </TouchableOpacity>

        <Text style={styles.textStyles(theme)}>
          {selectedContact ? selectedContact?.username : "Single Chat"}
        </Text>
        <Image
          source={{
            uri: `https://api.multiavatar.com/${selectedContact.username}.png?apikey=CglVv3piOwAuoJ`,
          }}
          style={styles.Image(20, 10)}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 10}
      >
        <View style={styles.flatListContainer}>
          <FlatList
            data={messages}
            renderItem={renderList}
            ref={flatListRef}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => setIsSticker(true)}
            style={styles.Button(theme, isConnected, 40, 40, 10)}
            disabled={!isConnected || isLoading || !socket}
          >
            <Image source={Icons.sticker} style={styles.Image(0, 0, 40, 40)} />
          </TouchableOpacity>
          <TextInput
            placeholder="Type a message"
            placeholderTextColor={theme === "dark" ? "white" : "black"}
            style={styles.TextInput(theme)}
            readOnly={!isConnected || isLoading || !socket}
            value={msg}
            onChangeText={(text) => setMsg(text)}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.Button(theme, isConnected, 45, 45, 0, 10)}
            disabled={!isConnected || msg.trim() === "" || isLoading || !socket}
          >
            <Image source={Icons.sendBtn} style={styles.Image(0, 0, 45, 45)} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={isSticker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSticker(false)}
        hardwareAccelerated={true}
      >
        <StickerComponent />
      </Modal>
    </SafeAreaView>
  );
};

export default SingleChat;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    flexDirection: "column",
  }),
  textStyles: (
    theme,
    fontSize = 20,
    fontWeight = "bold",
    color = theme === "dark" ? "white" : "black"
  ) => ({
    color: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
  }),
  header: (theme) => ({
    height: 50,
    width: "100%",
    backgroundColor: "transparent",
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor:
      theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    paddingBottom: 10,
  }),
  Image: (
    marginLeft = 0,
    marginR = 0,
    height = 50,
    width = 50,
    borderRadius = 0
  ) => ({
    height: height,
    width: width,
    marginLeft: marginLeft,
    marginRight: marginR,
    borderRadius: borderRadius,
  }),
  body: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  flatListContainer: {
    flex: 1,
  },
  footer: {
    flex: 0.15,
    width: "100%",
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    minHeight: 40,
    maxHeight: 150,
  },
  TextInput: (theme) => ({
    minHeight: 50,
    maxHeight: "100%",
    flex: 1,
    backgroundColor:
      theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
    borderRadius: 25,
    borderBlockColor:
      theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    borderWidth: 0.5,
    padding: 15,
    margin: 5,
    color: theme === "dark" ? "white" : "black",
    fontWeight: "bold",
    justifyContent: "center",
    alignItems: "center",
    alignText: "center",
  }),
  Button: (
    theme,
    isC,
    height = 50,
    width = 50,
    marginLeft = 0,
    marginR = 0
  ) => ({
    height: height,
    width: width,
    backgroundColor:
      theme === "dark"
        ? `rgba(198,0,198,${isC ? 0.8 : 0.2})`
        : `rgba(0,255,0,${isC ? 0.8 : 0.2})`,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginLeft: marginLeft,
    marginRight: marginR,
  }),
  flatListItem: (justifyContent = "flex-start") => ({
    padding: 5,
    backgroundColor: "transparent",
    margin: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: justifyContent,
  }),
  messageLeft: (isEmoji,chatColor) => ({
    backgroundColor: isEmoji ? "transparent" : chatColor.sender,
    borderRadius: 10,
    padding: 10,
    margin: 10,
    minWidth: 100,
    maxWidth: "80%",
  }),
  messageRight: (isEmoji,chatColor) => ({
    backgroundColor: isEmoji ? "transparent" : chatColor.receiver,
    borderRadius: 10,
    padding: 10,
    margin: 10,
    minWidth: 100,
    maxWidth: "80%",
  }),
  stickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  stickerContainer:(theme) => ({
    height: "50%",
    width: "100%",
    backgroundColor: theme === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  }),
  stickerHeader: {
    height: "10%",
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stickers: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  rows: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    margin: 10,
  },
  ScrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
